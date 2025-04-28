// cargo run
use reqwest::Client;
use serde_json::json;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Constants
    let sender_address = "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge";
    let receiver_address = "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt";
    let lovelace_amount = 10_000_000;
    let api_key = "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9";

    // Prepare JSON body
    let body = json!({
        "changeAddress": sender_address,
        "outputs": [
            {
                "address": receiver_address,
                "lovelace": lovelace_amount
            }
        ]
    });

    // Headers
    let client = Client::new();
    let response = client
        .post("https://preprod.api.ada-anvil.app/v2/services/transactions/build")
        .header("Content-Type", "application/json")
        .header("x-api-key", api_key)
        .json(&body)
        .send()
        .await?;

    // Parse and print JSON response
    let json_response: serde_json::Value = response.json().await?;
    println!("{}", serde_json::to_string_pretty(&json_response)?);

    Ok(())
}
