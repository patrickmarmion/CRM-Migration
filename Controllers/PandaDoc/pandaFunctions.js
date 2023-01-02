require('dotenv').config({
    path: "../../.env"
});
const axios = require('axios');
const api_key = process.env.PANDADOC_API_KEY;
const headers = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `API-Key ${api_key}`
    }
};
const crmProvider = process.env.CRM_PROVIDER;
const crmMetadataOpportunity = process.env.CRM_METADATA_OPPORTUNITY_NAME;
const crmMetadataAccount = process.env.CRM_METADATA_ACCOUNT_NAME;
const crmMetadataContact = process.env.CRM_METADATA_CONTACT_NAME;
let confirmation;
let correctID;

const checkRow = async (rowDetail) => {
    let result = await axios.get(`https://api.pandadoc.com/public/v1/documents/${rowDetail.document_id}/details`, headers);
    let linkedObj = result.data.linked_objects[0];
    if (rowDetail.old_entity_id in linkedObj) {
        return true
    } else {
        correctID = false
        return {
            correctID,
            result
        }
    }
};

const removeLinkedObj = async (document_id) => {
    let response_list = await axios.get(`https://api.pandadoc.com/public/v1/documents/${document_id}/linked-objects`, headers);
    let linked_object_id = await response_list.data.linked_objects[0].id;
    await axios.delete(`https://api.pandadoc.com/public/v1/documents/${document_id}/linked-objects/${linked_object_id}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `API-Key ${api_key}`
        }
    });
    console.log('deleted objects');
    return
}

const opportunity = async (rowDetail) => {
    await removeLinkedObj(rowDetail.document_id);
    let body = {
        "provider": crmProvider,
        "entity_type": crmMetadataOpportunity,
        "entity_id": `${rowDetail.new_entity_id}`
    }
    await axios.post(`https://api.pandadoc.com/public/v1/documents/${document_id}/linked-objects`, body, headers);
    console.log('linked opportunity object');
}

const account = async (rowDetail) => {
    await removeLinkedObj(rowDetail.document_id);
    let body = {
        "provider": crmProvider,
        "entity_type": crmMetadataAccount,
        "entity_id": `${rowDetail.new_entity_id}`
    }
    await axios.post(`https://api.pandadoc.com/public/v1/documents/${document_id}/linked-objects`, body, headers);
    console.log('linked account object');
}

const contact = async (rowDetail) => {
    await removeLinkedObj(rowDetail.document_id);
    let body = {
        "provider": crmProvider,
        "entity_type": crmMetadataContact,
        "entity_id": `${rowDetail.new_entity_id}`
    }
    await axios.post(`https://api.pandadoc.com/public/v1/documents/${document_id}/linked-objects`, body, headers);
    console.log('linked contact object');
}

const sortByEntityType = async (rowDetail) => {
    switch (true) {
        case rowDetail.crmEntity === crmMetadataOpportunity:
            confirmation = await checkRow(rowDetail);
            if (confirmation) {
                opportunity(rowDetail)
            } else {
                //errorProcessFunctionHERE()
            }
            break;
        case rowDetail.crmEntity === crmMetadataAccount:
            confirmation = await checkRow(rowDetail);
            if (confirmation) {
                account(rowDetail)
            } else {
                //errorProcessFunctionHERE()
            }
            break;
        case rowDetail.crmEntity === crmMetadataContact:
            confirmation = await checkRow(rowDetail);
            if (confirmation) {
                contact(rowDetail)
            } else {
                //errorProcessFunctionHERE()
            }
            break;
    }
};



module.exports = sortByEntityType