require('dotenv').config({
    path: "../../.env"
});
const axiosInstance = require("../../Config/axiosInstance");
const accessToken = process.env.PANDADOC_ACCESS_TOKEN;
const headers = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    }
};

const updateLinkedObject = async (provider, crmEntity, newEntityId, documentId, retries = 0) => {
    try {
        let body = {
            "provider": provider,
            "entity_type": crmEntity,
            "entity_id": newEntityId
        }
        await axiosInstance.post(`https://api.pandadoc.com/public/v1/documents/${documentId}/linked-objects`, body, headers);
    } catch (error) {
        if (error.response) {
            if (retries >= 3) {
              throw new Error("Max retries exceeded, giving up.");
            }
            console.log(error.response.data)
            console.log(`Received error, retrying in 3 seconds... (attempt ${retries + 1} of 3)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await updateLinkedObject(provider, crmEntity, newEntityId, retries + 1);
          }
          throw error;
    }
}

module.exports = updateLinkedObject