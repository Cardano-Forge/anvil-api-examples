use aiken/collection/dict
use cardano/transaction.{DatumHash, InlineDatum, NoDatum, Output, Transaction}

pub fn find_datum(output: Output, transaction: Transaction) -> Option<Data> {
  let output_datum = output.datum
  when output_datum is {
    InlineDatum(data) -> Some(data)
    DatumHash(hash) -> transaction.datums |> dict.get(hash)
    NoDatum -> None
  }
}
