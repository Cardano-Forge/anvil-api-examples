use aiken/primitive/bytearray.{concat, drop, starts_with}

/// (100) Reference Token Prefix
/// https://developers.cardano.org/docs/governance/cardano-improvement-proposals/cip-0068/#222-nft-standard
pub const prefix_100: ByteArray = #"000643b0"

/// (222) Non-Fungible Token Prefix
/// https://developers.cardano.org/docs/governance/cardano-improvement-proposals/cip-0068/#222-nft-standard
pub const prefix_222: ByteArray = #"000de140"

pub fn is_ref_token(assetname: ByteArray) -> Bool {
  assetname |> starts_with(prefix_100)
}

pub fn is_user_token(assetname: ByteArray) -> Bool {
  assetname |> starts_with(prefix_222)
}

///take an assetname in param and return ref_token + user_token
pub fn generate_ref_and_user_token(
  assetname: ByteArray,
) -> (ByteArray, ByteArray) {
  if or {
    is_ref_token(assetname),
    is_user_token(assetname),
  } {
    let assetname_without_prefix = assetname |> drop(4)
    (
      prefix_100 |> concat(assetname_without_prefix),
      prefix_222 |> concat(assetname_without_prefix),
    )
  } else {
    (prefix_100 |> concat(assetname), prefix_222 |> concat(assetname))
  }
}

test valid_ref_token() {
  is_ref_token(#"000643b052656c6963734f664d61676d61546865506f72746130333935")
}

test invalid_ref_token() fail {
  is_ref_token(#"00643b052656c6963734f664d61676d61546865506f727461303339355")
}

test valid_user_token() {
  is_user_token(#"000de14052656c6963734f664d61676d61546865506f72746130333935")
}

test invalid_user_token() fail {
  is_user_token(#"000de1452656c6963734f664d61676d61546865506f727461303339355")
}

test validate_generate_ref_and_user_token() {
  let assetname = #"52656c6963734f664d61676d61546865506f72746130333935"
  let (ref_token, user_token) = generate_ref_and_user_token(assetname)
  and {
    ( prefix_100 |> concat(assetname) ) == ref_token,
    ( prefix_222 |> concat(assetname) ) == user_token,
  }
}
