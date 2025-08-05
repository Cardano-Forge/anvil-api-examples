use aiken/collection/list.{at}
use cardano/address.{Address, Script, from_script, with_delegation_key}
use cardano/assets.{PolicyId, Value, add, without_lovelace, zero}
use cardano/transaction.{InlineDatum, Output, Transaction, placeholder}
use datum.{find_datum}
use types.{Cip68Metadata}
use utils.{generate_ref_and_user_token}

pub fn generate_mint(
  tokens: List<(ByteArray, Int)>,
  policy_id: PolicyId,
  mint: Value,
  self: Transaction,
) -> Value {
  when tokens is {
    [] -> mint
    [(assetname, index), ..rest] -> {
      let (ref_tok, user_tok) = generate_ref_and_user_token(assetname)
      //Find the output with the vault token
      expect Some(output) = self.outputs |> at(index)
      //Check that the output datum is the right type
      expect Some(datum) = find_datum(output, self)
      //IMPORTANT if you dont do that check, you wont be able to spend it
      //So it might be permanently locked
      expect _: Cip68Metadata = datum

      //Project has to make sure there is no double minting
      //otherwise we would have to only allow 1 mint / transaction
      //On the output, it should only contains 1 nft that starts with label 100 (ref nft)
      //with 1 nft with the label 100 that contains the user token on another address
      let output_value = without_lovelace(output.value)

      let expected_output_value = zero |> add(policy_id, ref_tok, 1)
      expect output_value == expected_output_value
      //Make sure the nft is submitted to the script address
      expect
        when output.address.payment_credential is {
          Script(hash) -> hash == policy_id
          _ -> False
        }
      generate_mint(
        rest,
        policy_id,
        mint
          |> add(policy_id, ref_tok, 1)
          |> add(policy_id, user_tok, 1),
        self,
      )
    }
  }
}

test check_mint() {
  let policy_id = #"000643b0"

  let owner: Address =
    from_script(policy_id)
      |> with_delegation_key(
          #"3d52dbeb0e4223355b59fedfde0a7a225392d0b0ac443aee46341a87",
        )

  let assetnames =
    [
      (#"52656c6963734f664d61676d61546865506f72746130333935", 0),
      (#"52656c6963734f664d61676d61546865506f72746130333936", 1),
    ]
  let mint =
    zero
      |> add(
          policy_id,
          #"000643b052656c6963734f664d61676d61546865506f72746130333935",
          1,
        )
      |> add(
          policy_id,
          #"000643b052656c6963734f664d61676d61546865506f72746130333936",
          1,
        )
      |> add(
          policy_id,
          #"000de14052656c6963734f664d61676d61546865506f72746130333935",
          1,
        )
      |> add(
          policy_id,
          #"000de14052656c6963734f664d61676d61546865506f72746130333936",
          1,
        )

  let datum =
    Cip68Metadata { metadata: [], version: 1, extra_datum: None }
      |> InlineDatum
  let outputs: List<Output> =
    [
      Output {
        address: owner,
        value: zero
          |> add(
              policy_id,
              #"000643b052656c6963734f664d61676d61546865506f72746130333935",
              1,
            ),
        datum,
        reference_script: None,
      },
      Output {
        address: owner,
        value: zero
          |> add(
              policy_id,
              #"000643b052656c6963734f664d61676d61546865506f72746130333936",
              1,
            ),
        datum,
        reference_script: None,
      },
    ]
  let transaction = Transaction { ..placeholder, outputs: outputs }

  let expected_mint = generate_mint(assetnames, policy_id, zero, transaction)
  expect expected_mint == mint
}
