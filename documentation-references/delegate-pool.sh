POOL_ID="pool1n3sjq3qvu5vvcd6aud6ndcwq7r3ghmkafcg60gznlwfrk2ucxku"
ADDR="addr_test1qzyttcj6czjltcs3tn3vls6yg90542lctrzwg5aagduqlfgupztxhczzmuakzfuwvrht542yrx7ll3fk29lcl2xl8axqh3pjdh"
# See Authentication page for API key details.
X_API_KEY="CgYuz62xAS7EfM0hCP1gz1aOeHlQ4At36pGwnnLf"
API_URL="https://preprod.api.ada-anvil.app/v2/services"

curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Api-Key: ${X_API_KEY}" \
     -d '{
           "changeAddress": "'${ADDR}'",
           "delegations": [
             {
               "type": "pool",
               "address": "'${ADDR}'",
               "keyHash": "'${POOL_ID}'"
             }
           ]
         }' \
     ${API_URL}/transactions/build
