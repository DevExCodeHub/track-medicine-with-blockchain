# track-medicine-with-blockchain
# Steps

1. [Sign up on IBM Cloud](#1-sign-up-on-ibm-cloud)
2. [Clone the repo](#2-clone-the-repo)
3. [Create IBM Blockchain Service](#3-create-ibm-blockchain-service)
4. [Test your network using IBM playground](#4-test-your-blockchain-network-using-ibm-playground)
5. [Deploy your blockchain network ](#5-deploy-your-blockchain-network-optional )


### 1. Sign up on IBM Cloud
1. Sign up on [IBM Cloud] (https://ibm.biz/BdY7C7)
2. Redeem Promo Code 
   * Click on **User Icon**
   * Click on **Profile**
   * From the left menu, click on **Billing** 
   * Click on **Apply Code** under Feature (Promo) Codes
   * Enter your promo code, click on **Apply**

### 2. Clone the repo
1. Click `Clone or download` button. Then, `Download ZIP`.
2. Right click on the downloaded `.zip` folder and click `Extract All`.

### 3. Create IBM Blockchain Service
1. Create [IBM Blockchain Service] (https://console.bluemix.net/catalog/services/blockchain)
2. Click on **Launch Button**
3. Click on **Got it**

### 4. Test your blockchain network using IBM playground
1.  From the left menu, Click on **Develop Code** under My Code Section
2.  Click on **Try Web Playground**
3.  Click on **Launch Noe**
4.  Click on **Deploy A New Business Network**
5.  Click on **Drop here to upload or browse**
6.  Choose `track-medicine.bna` file that you download
7.  Click on **Deploy**
8.  Click on **Connect now**
9.  Click on **Test** from top menu
10. Click on **Submit Transaction**
11. Choose Set up Demo
12. Click on **Submit**

### 5. Deploy your blockchain network (Optional)
1. Prerequisite:
   * Ensure that you install **Ubuntu Linux 14.04 / 16.04 LTS (both 64-bit) or Mac OS 10.12**, **Node**, **npm** and **Python**

2. Set up Your Environment:
   * Install composer-cli by using the following command:
      ```
       npm install -g composer-cli@0.20.x
       ```
   * Install composer-rest-server by using the following command:
      ```
        npm install -g composer-rest-server@0.20.x
       ```
   * Install generator-hyperledger-composer by using the following command:
      ```
        npm install -g generator-hyperledger-composer@0.20.x
       ```
3. Deploy The Business Network
  1. Retrieve admin secret
   * Go back to the blockchain main page
   * click on **Connection Profile** and then **download**. Rename the downloaded file to `connection-profile.json`
   * Move `connection-profile.json` file to be in the same directory as your `track-medicine.bna` file.
   * Inside the connection profile, search for `registrar`. Inside `registrar`, under `enrollId` there is an enrollSecret property. Copy the value.
   
  2. Creating a certificate authority card
   * Using the enrollSecret noted from step one, run the following command to create the CA business network card:
   ```
      composer card create -f ca.card -p connection-profile.json -u admin -s enrollSecret
   ``` 
   * Import the card using the following command:
   
   ```
      composer card import -f ca.card -c ca
   ```
   * Now that the card is imported, it can be used to exchange the enrollSecret for valid certificates from the CA. Run the following command to request certificates from the certificate authority:
   ```
   composer identity request --card ca --path ./credentials -u admin -s enrollSecret
   ```
   Replace **enrollSecret** in the preceding command with the admin secret retrieved from the connection profile at step 1. 
   The composer identity request command creates a `credentials directory` that contains certificate .pem files.

   
  3. Adding the certificates to the Starter Plan instance
   * In the main page, click on **Members** tab, then **Certificates**, then **Add Certificate**. Go to your `credentials directory`, and copy and paste the contents of the `admin-pub.pem` file in the certificate box. Submit the certificate and restart the peers. Note: restarting the peers takes a minute.
   * Click on **Channels** tab, then the **Actions** button, then **Sync Certificate** and **Submit**.
    
  4. Creating an admin business network card
   * Create an admin card with the channel admin and peer admin roles by using the following command:
    
    ```
         composer card create -f adminCard.card -p connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin priv.pem --role PeerAdmin --role ChannelAdmin
    ```
   * Import the card created in the previous step using the following command:
    
    ```
       composer card import -f adminCard.card -c adminCard
    ```
    
  5. Installing and starting the business network
    * Install the Hyperledger Composer runtime with the following command:
        ```
           composer network install -c adminCard -a track-medicine.bna
        ```
   Note the business network version number which is returned when you run this command. It will be required in the next step.
    * Start the business network with the command below. If you get an error, wait a minute and try again. Use the version number from the last step after the -V option.
     ```
         composer network start -c adminCard -n track-medicine -V 0.0.1 -A admin -C ./credentials/admin-pub.pem -f delete_me.card
     ```
    * Delete the business network card called delete_me.card.
    * Create a new business network card and reference the certificates that are retrieved earlier with the following command:
     ```
         composer card create -n track-medicine -p connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem
     ```
       
   * Import the business network card with the following command:
     ```
          composer card import -f ./admin@track-medicine.card
     ```
   The business network is now deployed.

  6. Ping the business network to ensure it is running correctly
     ```
    composer network ping -c admin@vehicle-manufacture-network
     ```
    
  7. Explore your business network from network monitor

   
   
   



 
