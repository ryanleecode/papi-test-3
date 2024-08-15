import { type TxEvent } from "polkadot-api";
import {
  delay,
  mergeMap,
  Observable,
  of,
  retry,
  throwError,
} from "rxjs";

export const retryOnStale =
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
        if (e.type === "txBestBlocksState" && !e.found && !e.isValid) {
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
