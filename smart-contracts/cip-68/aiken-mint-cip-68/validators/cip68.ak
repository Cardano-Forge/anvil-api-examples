use aiken/collection/list.{at, map}
use aiken/crypto.{VerificationKeyHash}
use cardano/address.{VerificationKey}
use cardano/assets.{
  PolicyId, flatten, quantity_of, tokens, without_lovelace, zero,
}
use cardano/transaction.{OutputReference, Transaction, find_input}
use datum.{find_datum}
use mint.{generate_mint}
use types.{AdminUpdate, Cip68Metadata, MintRedeemer, SpendRedeemer, UserUpdate}
use utils.{generate_ref_and_user_token}

validator cip68examples(signer: VerificationKeyHash) {
  //all the minting rules

  //make sure to mint (100) and (222) with the same assetnames with quantity 1
  // make sure that the (100) ref token is sent to the sc
  mint(redeemer: MintRedeemer, policy_id: PolicyId, self: Transaction) {
    let is_signed = list.has(self.extra_signatories, signer)

    let expected_mint =
      generate_mint(redeemer.assetnames, policy_id, zero, self)
        |> tokens(policy_id)

    let currently_minting = self.mint |> tokens(policy_id)

    and {
      is_signed?,
      (expected_mint == currently_minting)?,
    }
  }

  //every ref tokens are here
  //always make sure that the ref token stays on the smartcontract

  //custom logic to update, for instance an user 
  //can change the owner_nickname of the nft when hes paying 1 ada
  //or the admin sign the transaction
  spend(
    datum: Option<Cip68Metadata>,
    redeemer: SpendRedeemer,
    output_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(datum) = datum
    //Find the spent input
    let input = find_input(self.inputs, output_ref)
    expect Some(input) = input

    //Find the output specified by the builder where the ref token will be
    let output = self.outputs |> at(redeemer.output_index)
    expect Some(output) = output

    //Make sure the address stays the same
    let input_and_output_have_the_same_address =
      input.output.address == output.address

    //Make sure that the token is still there
    let ref_token_stays_on_the_smartcontract =
      without_lovelace(input.output.value) == without_lovelace(output.value)

    let ref_token = flatten(without_lovelace(input.output.value)) |> at(0)
    expect Some(ref_token) = ref_token

    let update_authorized =
      when redeemer.update is {
        //1st condition: updated by the user while paying the 1 ada fee
        //Warning: Use the same output for multiple updates
        UserUpdate { nickname, fee_output_index, output_ref_user_token } -> {
          //Pay the fees
          let fee_output = self.outputs |> at(fee_output_index)
          expect Some(fee_output) = fee_output
          //Make sure the pkh is the admin of the sc
          let is_paid_to_admin =
            when fee_output.address.payment_credential is {
              VerificationKey(pkh) -> pkh == signer
              _ -> False
            }
          //The amount of ada on the output is 1
          let lovelace_paid = fee_output.value |> quantity_of("", "")

          //Find the datum on the output
          let current_datum = find_datum(output, self)
          expect Some(current_datum) = current_datum
          expect current_datum: Cip68Metadata = current_datum
          let expected_datum =
            Cip68Metadata {
              metadata: map(
                datum.metadata,
                fn(Pair(key, value)) {
                  expect bytearray_key: ByteArray = key
                  if bytearray_key == "nickname" {
                    let data_nickname_value: Data = nickname
                    Pair(key, data_nickname_value)
                  } else {
                    Pair(key, value)
                  }
                },
              ),
              version: 1,
              extra_datum: datum.extra_datum,
            }

          //Make sure the user that has the user token sign the tx
          let user_token_input = find_input(self.inputs, output_ref_user_token)
          expect Some(user_token_input) = user_token_input
          let (_, user_token) = generate_ref_and_user_token(ref_token.2nd)
          let user_token_quantity =
            user_token_input.output.value
              |> quantity_of(ref_token.1st, user_token)
          and {
            (lovelace_paid == 1000000)?,
            is_paid_to_admin?,
            (current_datum == expected_datum)?,
            (user_token_quantity == 1)?,
          }
        }

        //2nd condition: signed by admin (update by admin)
        AdminUpdate -> list.has(self.extra_signatories, signer)
      }

    and {
      ref_token_stays_on_the_smartcontract?,
      input_and_output_have_the_same_address?,
      update_authorized?,
    }
  }

  else(_) {
    fail
  }
}
