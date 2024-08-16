import { polkadot_people, westend2_people } from "@polkadot-api/descriptors";
import { Binary, createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withLogsRecorder } from "@polkadot-api/logs-provider";
import * as fs from "node:fs";
import type { IterableElement } from "type-fest";

const f = fs.createWriteStream("test.log");

const descriptorMap = {
  westend2: westend2_people,
  polkadot: polkadot_people,
} as const

//// 1
(async () => {
  const client = createClient(
    withLogsRecorder(
      (l) => f.write(`${l}\n`),
      getWsProvider("wss://polkadot-people-rpc.polkadot.io")
    )
  );
  const peopleApi = client.getTypedApi(descriptorMap["polkadot"]);

  type Swag = IterableElement<
    Parameters<typeof peopleApi.tx.Utility.batch>[0]["calls"]
  > & { type: "Identity" };

  const calls: Swag[] = [
    peopleApi.tx.Identity.set_username_for({
      who: { type: "Id", value: "" },
      username: Binary.fromText(""),
      signature: { type: "Sr25519", value: Binary.fromHex("") },
    }).decodedCall,
  ];

  peopleApi.tx.Utility.batch({ calls });
})();

//// 2
(async () => {
  const client = createClient(
    withLogsRecorder(
      (l) => f.write(`${l}\n`),
      getWsProvider("wss://westend-people-rpc.polkadot.io")
    )
  );
  const peopleApi = client.getTypedApi(descriptorMap["westend2"]);

  type Swag = IterableElement<
    Parameters<typeof peopleApi.tx.Utility.batch>[0]["calls"]
  > & { type: "Identity" };

  const calls: Swag[] = [
    peopleApi.tx.Identity.set_username_for({
      who: { type: "Id", value: "" },
      username: Binary.fromText(""),
      signature: { type: "Sr25519", value: Binary.fromHex("") },
    }).decodedCall,
  ];

  peopleApi.tx.Utility.batch({ calls });
})();

//// 3
(async () => {
  const client = createClient(
    withLogsRecorder(
      (l) => f.write(`${l}\n`),
      getWsProvider("wss://westend-people-rpc.polkadot.io")
    )
  );
  const network: keyof typeof descriptorMap = "westend2" as keyof typeof descriptorMap;
  const peopleApi = client.getTypedApi(descriptorMap[network]);

  type Swag = IterableElement<
    Parameters<typeof peopleApi.tx.Utility.batch>[0]["calls"]
  > & { type: "Identity" };

  const calls: Swag[] = [
    peopleApi.tx.Identity.set_username_for({
      who: { type: "Id", value: "" },
      username: Binary.fromText(""),
      signature: { type: "Sr25519", value: Binary.fromHex("") },
    }).decodedCall,
  ];

  peopleApi.tx.Utility.batch({ calls });
})();
