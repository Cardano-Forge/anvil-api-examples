# python mod.py
import requests
import json

# Define constants
SENDER_ADDRESS = "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge"
RECEIVER_ADDRESS = "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt"
LOVELACE_AMOUNT = 10_000_000
X_API_KEY = "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9"

# Prepare the request body
body = {
    "changeAddress": SENDER_ADDRESS,
    "outputs": [
        {
            "address": RECEIVER_ADDRESS,
            "lovelace": LOVELACE_AMOUNT,
        },
    ],
}

# Make the POST request
headers = {
    "Content-Type": "application/json",
    "x-api-key": X_API_KEY,
}
response = requests.post(
    "https://preprod.api.ada-anvil.app/v2/services/transactions/build",
    headers=headers,
    data=json.dumps(body),
)

# Print the response JSON
print(response.json())
