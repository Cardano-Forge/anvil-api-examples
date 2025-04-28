# docker run -it --rm -v ./basic-tx.php:/usr/src/myapp/basic-tx.php -w /usr/src/myapp php:8.2-cli php basic-tx.php
<?php

// Define constants
$senderAddress = "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge";
$receiverAddress = "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt";
$lovelaceAmount = 10000000;
$apiKey = "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9";

// Prepare the request body
$body = json_encode([
    "changeAddress" => $senderAddress,
    "outputs" => [
        [
            "address" => $receiverAddress,
            "lovelace" => $lovelaceAmount,
        ]
    ]
]);

// Initialize cURL
$ch = curl_init("https://preprod.api.ada-anvil.app/v2/services/transactions/build");

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "x-api-key: $apiKey"
]);

// Execute request and capture response
$response = curl_exec($ch);

// Check for errors
if (curl_errno($ch)) {
    echo "Request error: " . curl_error($ch);
    curl_close($ch);
    exit(1);
}

curl_close($ch);

// Decode and print JSON response
$responseData = json_decode($response, true);
echo json_encode($responseData, JSON_PRETTY_PRINT) . PHP_EOL;
