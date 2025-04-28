defmodule AdaTxBuilder do
  @moduledoc false

  @sender_address "addr_test1qrydyk6uw6cehk5u3zspyz3dhnwzmhfls2fp42vv5dv9g2z3885pg4kpkn30ptezc855lu3w5ey93zcr5lrezjmwkftqg8xvge"
  @receiver_address "addr_test1qr0tkwvlln0v5fljdxceudmlpt5y6szc84vpj4skm836tgn4hsqaesgg97l8ppy5rsn0alj8pth6lqe20fdyydsdgw6sr74cyt"
  @lovelace 10_000_000
  @api_key "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9"
  @url "https://preprod.api.ada-anvil.app/v2/services/transactions/build"

  def run do
    headers = [
      {"Content-Type", "application/json"},
      {"x-api-key", @api_key}
    ]

    body = %{
      "changeAddress" => @sender_address,
      "outputs" => [
        %{
          "address" => @receiver_address,
          "lovelace" => @lovelace
        }
      ]
    }

    case HTTPoison.post(@url, Jason.encode!(body), headers) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        body
        |> Jason.decode!()
        |> IO.inspect(label: "Response")

      {:ok, %HTTPoison.Response{status_code: code, body: body}} ->
        IO.puts("Error: Status #{code}")
        IO.puts(body)

      {:error, %HTTPoison.Error{reason: reason}} ->
        IO.inspect(reason, label: "Request Error")
    end
  end
end
