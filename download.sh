# Bash script to ingest data
# This involves scraping the data from the web and then cleaning up and putting in Weaviate.
# Error if any command fails
set -e
echo Downloading docs...
#wget -q -r -A.html https://langchain.readthedocs.io/en/latest/
wget -q -r https://help.bringg.com/v1/docs/
