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

const listLinkedObject = async (id, retries = 0) => {
    try {
        let response = await axiosInstance.get(`https://api.pandadoc.com/public/v1/documents/${id}/linked-objects`, headers);
        return response.data.linked_objects[0].id;
    } catch (error) {
        if (error.response) {
            if (retries >= 3) {
              throw new Error("Max retries exceeded, giving up.");
            }
            console.log(error.response.data)
            console.log(`Received error, retrying in 3 seconds... (attempt ${retries + 1} of 3)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await listLinkedObject(id, retries + 1);
          }
          throw error;
    }
}

module.exports = listLinkedObject