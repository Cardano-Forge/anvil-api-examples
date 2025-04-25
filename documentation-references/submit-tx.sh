SIGNATURE="a1008182582085bd57924203d54f2b14bb3be31403807c9bc72e1d0e71541a2c76a931d851bf5840e9bccbba5bb7806c9201b02eb12f27fd4f9f7043231914a3e5870361113ae3073fb4806419fa8e5dc4c84a6cef1f0ee30e74a0e1b7f16148ec977cced373f10f"
TRANSACTION="84a400d9010281825820d4b5505d9061bb4e37dd05a35e3661c66db435163af600a72197723f415da43d0101828258390097d20ce7a3003369cf916bafb166fe94a4fcc6af61250abfe377122879773d7df44c3af7e3ad81b8be3cf76a5043a15ecf18e1d3d669d00d1a0098968082583900d863b90d9b47629c09d2996ec4154a3f8bdbd72d5ecc85ab461854f38fcbfb9e771a928d717bd9877bc6db9a3dfa728330031aa2877c13b41a1dc7cb58021a0003cb05031a04e1b90ba0f5f6"
# See Authentication page for API key details.
X_API_KEY="testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9"
API_URL="https://preprod.api.ada-anvil.app/v2/services"

curl -XPOST \
    -H "Content-Type: application/json" \
    -H "X-Api-Key: ${X_API_KEY}" \
    -d '{"transaction": "'${TRANSACTION}'", "signatures": ["'${SIGNATURE}'"]}' \
    ${API_URL}/transactions/submit
