require('dotenv').config({
    path: "../../.env"
});
const axiosInstance = require("../../Config/axiosInstance");
const access_token = process.env.PANDADOC_ACCESS_TOKEN;
const headers = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
    }
};

const updateLinkedObject = async (provider, crmEntity, new_entity_id, retries = 0) => {
    try {
        let body = {
            "provider": provider,
            "entity_type": crmEntity,
            "entity_id": new_entity_id
        }
        await axiosInstance.post(`https://api.pandadoc.com/public/v1/documents/${rowDetail.new_document_id}/linked-objects`, body, headers);
    } catch (error) {
        if (error.response) {
            if (retries >= 5) {
              throw new Error("Max retries exceeded, giving up.");
            }
            console.log(error.response.data)
            console.log(`Received error, retrying in 3 seconds... (attempt ${retries + 1} of 5)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await updateLinkedObject(provider, crmEntity, new_entity_id, retries + 1);
          }
          throw error;
    }
}

module.exports = updateLinkedObject