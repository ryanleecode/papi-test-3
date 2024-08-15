import { westend2_people } from "@polkadot-api/descriptors";
import { Binary, createClient, TxEvent } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
  ss58Address,
} from "@polkadot-labs/hdkd-helpers";
import { getPolkadotSigner } from "@polkadot-api/signer";
import { toHex } from "@polkadot-api/utils";
import { withLogsRecorder } from "@polkadot-api/logs-provider";
import * as fs from "node:fs";
import {
  delay,
  filter,
  firstValueFrom,
  mergeMap,
  Observable,
  of,
  retry,
  tap,
  throwError,
} from "rxjs";

const f = fs.createWriteStream("test.log");

(async () => {
  const mnemonic =
    "XXXXXXXXXXXXXXXXXXXXX";

  const client = createClient(
    withLogsRecorder(
      (l) => f.write(`${l}\n`),
      getWsProvider("wss://westend-people-rpc.polkadot.io")
    )
  );
  const peopleApi = client.getTypedApi(westend2_people);

  const entropy = mnemonicToEntropy(mnemonic);
  const miniSecret = entropyToMiniSecret(entropy);
  const derive = sr25519CreateDerive(miniSecret);

  const alice = derive("//Alice");
  const bob = derive("//Bob");

  const ss58Prefix = peopleApi.constants.System.SS58Prefix(
    await peopleApi.compatibilityToken
  );

  await firstValueFrom(
    peopleApi.tx.Identity.set_username_for({
      who: { type: "Id", value: ss58Address(bob.publicKey, ss58Prefix) },
      username: Binary.fromText("asdf18"),
      signature: {
        type: "Sr25519",
        value: Binary.fromBytes(
          bob.sign(new TextEncoder().encode("asdf18.ryan123"))
        ),
      },
    })
      .signSubmitAndWatch(
        getPolkadotSigner(alice.publicKey, "Sr25519", alice.sign)
      )
      .pipe(
        tap({ next: (e) => console.log(e) }),
        retryOnStale({ maxRetries: 10, initialDelay: 1000 }),
        filter((e) => e.type === "txBestBlocksState" && e.found === true)
      )
  );

  client.destroy()
})();

const retryOnStale =
  ({
    maxRetries,
    initialDelay,
    factor = 2.0,
  }: {
    maxRetries: number;
    initialDelay: number;
    factor?: number;
  }) =>
  (source: Observable<TxEvent>) =>
    source.pipe(
      mergeMap((e) => {
        if (
          e.type === "txBestBlocksState" &&
          e.found === false &&
          e.isValid === false
        ) {
          return throwError(() => "stale");
        }

        return of(e);
      }),
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          if (error === "stale") {
            return of(delay(initialDelay * Math.pow(factor, retryCount)));
          }

          return throwError(() => error);
        },
      })
    );
