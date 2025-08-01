use cardano/transaction.{OutputReference}

pub type MetadataUpdateExpiration =
  Option<Int>

pub type Cip68Metadata {
  metadata: Pairs<Data, Data>,
  version: Int,
  extra_datum: MetadataUpdateExpiration,
}

pub type MintRedeemer {
  assetnames: List<(ByteArray, Int)>,
}

pub type MetadataUpdateType {
  AdminUpdate
  UserUpdate {
    nickname: ByteArray,
    fee_output_index: Int,
    output_ref_user_token: OutputReference,
  }
}

pub type SpendRedeemer {
  output_index: Int,
  update: MetadataUpdateType,
}
