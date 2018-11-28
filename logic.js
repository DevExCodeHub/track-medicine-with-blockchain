/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getParticipantRegistry getAssetRegistry getFactory */

/**
 * A medicine has been received by an importer
 * @param {org.acme.shipping.medicine.MedicineReceived} medicineReceived - the MedicineReceived transaction
 * @transaction
 */
async function payOut(medicineReceived) {  // eslint-disable-line no-unused-vars

    const contract = medicineReceived.medicine.contract;
    const medicine = medicineReceived.medicine;
    let payOut = contract.unitPrice * medicine.unitCount;

    console.log('Received at: ' + medicineReceived.timestamp);
    console.log('Contract arrivalDateTime: ' + contract.arrivalDateTime);

    // set the status of the medicine
    medicine.status = 'ARRIVED';

    // if the medicine did not arrive on time the payout is zero
    if (medicineReceived.timestamp > contract.arrivalDateTime) {
        payOut = 0;
        console.log('Late medicine');
    } else {
        // find the lowest temperature reading
        if (medicine.temperatureReadings) {
            // sort the temperatureReadings by centigrade
            medicine.temperatureReadings.sort(function (a, b) {
                return (a.centigrade - b.centigrade);
            });
            const lowestReading = medicine.temperatureReadings[0];
            const highestReading = medicine.temperatureReadings[medicine.temperatureReadings.length - 1];
            let penalty = 0;
            console.log('Lowest temp reading: ' + lowestReading.centigrade);
            console.log('Highest temp reading: ' + highestReading.centigrade);

            // does the lowest temperature violate the contract?
            if (lowestReading.centigrade < contract.minTemperature) {
                penalty += (contract.minTemperature - lowestReading.centigrade) * contract.minPenaltyFactor;
                console.log('Min temp penalty: ' + penalty);
            }

            // does the highest temperature violate the contract?
            if (highestReading.centigrade > contract.maxTemperature) {
                penalty += (highestReading.centigrade - contract.maxTemperature) * contract.maxPenaltyFactor;
                console.log('Max temp penalty: ' + penalty);
            }

            // apply any penalities
            payOut -= (penalty * medicine.unitCount);

            if (payOut < 0) {
                payOut = 0;
            }
        }
    }

    console.log('Payout: ' + payOut);
    contract.exporter.accountBalance += payOut;
    contract.importer.accountBalance -= payOut;

    console.log('Exporter: ' + contract.exporter.$identifier + ' new balance: ' + contract.exporter.accountBalance);
    console.log('Importer: ' + contract.importer.$identifier + ' new balance: ' + contract.importer.accountBalance);

    // update the exporter's balance
    const exporterRegistry = await getParticipantRegistry('org.acme.shipping.medicine.Exporter');
    await exporterRegistry.update(contract.exporter);

    // update the importer's balance
    const importerRegistry = await getParticipantRegistry('org.acme.shipping.medicine.Importer');
    await importerRegistry.update(contract.importer);

    // update the state of the medicine
    const medicineRegistry = await getAssetRegistry('org.acme.shipping.medicine.Medicine');
    await medicineRegistry.update(medicine);
}

/**
 * A temperature reading has been received for a medicine
 * @param {org.acme.shipping.medicine.TemperatureReading} temperatureReading - the TemperatureReading transaction
 * @transaction
 */
async function temperatureReading(temperatureReading) {  // eslint-disable-line no-unused-vars

    const medicine = temperatureReading.medicine;

    console.log('Adding temperature ' + temperatureReading.centigrade + ' to medicine ' + medicine.$identifier);

    if (medicine.temperatureReadings) {
        medicine.temperatureReadings.push(temperatureReading);
    } else {
        medicine.temperatureReadings = [temperatureReading];
    }

    // add the temp reading to the medicine
    const medicineRegistry = await getAssetRegistry('org.acme.shipping.medicine.Medicine');
    await medicineRegistry.update(medicine);
}

/**
 * Initialize some test assets and participants useful for running a demo.
 * @param {org.acme.shipping.medicine.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
async function setupDemo(setupDemo) {  // eslint-disable-line no-unused-vars

    const factory = getFactory();
    const NS = 'org.acme.shipping.medicine';

    // create the exporter
    const exporter = factory.newResource(NS, 'Exporter', 'factory@email.com');
    const exporterAddress = factory.newConcept(NS, 'Address');
    exporterAddress.country = 'USA';
    exporter.address = exporterAddress;
    exporter.accountBalance = 0;

    // create the importer
    const importer = factory.newResource(NS, 'Importer', 'pharmacy@email.com');
    const importerAddress = factory.newConcept(NS, 'Address');
    importerAddress.country = 'UK';
    importer.address = importerAddress;
    importer.accountBalance = 0;

    // create the shipper
    const shipper = factory.newResource(NS, 'Shipper', 'shipper@email.com');
    const shipperAddress = factory.newConcept(NS, 'Address');
    shipperAddress.country = 'Panama';
    shipper.address = shipperAddress;
    shipper.accountBalance = 0;

    // create the contract
    const contract = factory.newResource(NS, 'Contract', 'CON_001');
    contract.exporter = factory.newRelationship(NS, 'Exporter', 'factory@email.com');
    contract.importer = factory.newRelationship(NS, 'Importer', 'pharmacy@email.com');
    contract.shipper = factory.newRelationship(NS, 'Shipper', 'shipper@email.com');
    const tomorrow = setupDemo.timestamp;
    tomorrow.setDate(tomorrow.getDate() + 1);
    contract.arrivalDateTime = tomorrow; // the medicine has to arrive tomorrow
    contract.unitPrice = 0.5; // pay 50 cents per unit
    contract.minTemperature = 2; // min temperature for the cargo
    contract.maxTemperature = 10; // max temperature for the cargo
    contract.minPenaltyFactor = 0.2; // we reduce the price by 20 cents for every degree below the min temp
    contract.maxPenaltyFactor = 0.1; // we reduce the price by 10 cents for every degree above the max temp

    // create the medicine
    const medicine = factory.newResource(NS, 'Medicine', 'SHIP_001');
    medicine.type = 'Antipyretics';
    medicine.status = 'IN_TRANSIT';
    medicine.name = 'FEVADOL';
    medicine.ingrediants = 'paracetamol, maize starch, potassium sorbate.'
    medicine.sideEffects = 'Vomiting, Fatigue'
    medicine.unitCount = 5000;
    medicine.contract = factory.newRelationship(NS, 'Contract', 'CON_001');
    

    // add the exporters
    const exporterRegistry = await getParticipantRegistry(NS + '.Exporter');
    await exporterRegistry.addAll([exporter]);

    // add the importers
    const importerRegistry = await getParticipantRegistry(NS + '.Importer');
    await importerRegistry.addAll([importer]);

    // add the shippers
    const shipperRegistry = await getParticipantRegistry(NS + '.Shipper');
    await shipperRegistry.addAll([shipper]);

    // add the contracts
    const contractRegistry = await getAssetRegistry(NS + '.Contract');
    await contractRegistry.addAll([contract]);

    // add the medicines
    const medicineRegistry = await getAssetRegistry(NS + '.Medicine');
    await medicineRegistry.addAll([medicine]);
}