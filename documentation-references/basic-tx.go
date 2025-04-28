package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

// Constants
const (
	senderAddress   = "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge"
	receiverAddress = "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt"
	lovelaceAmount  = 10000000
	apiKey          = "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9"
)

func main() {
	// Create request body
	body := map[string]interface{}{
		"changeAddress": senderAddress,
		"outputs": []map[string]interface{}{
			{
				"address":  receiverAddress,
				"lovelace": lovelaceAmount,
			},
		},
	}

	// Convert body to JSON
	jsonData, err := json.Marshal(body)
	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", "https://preprod.api.ada-anvil.app/v2/services/transactions/build", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error making request:", err)
		return
	}
	defer resp.Body.Close()

	// Read response
	bodyBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
		return
	}

	// Print response
	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		fmt.Println("Error unmarshaling response:", err)
		return
	}

	prettyJSON, _ := json.MarshalIndent(result, "", "  ")
	fmt.Println(string(prettyJSON))
}
