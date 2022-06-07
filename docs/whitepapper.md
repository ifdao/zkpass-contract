# zkPass Protocol

## Overview
  zkPass is a decentralized KYC solution based on MPC (Multi-Party Computation) and ZKP, which aims to overcome various flaws in the current KYC system, eliminate the pain points related to identity verification, and protect user privacy while expanding KYC capabilities.
  
## Definitions
  * P stands for prover
  * V is for verifier
  * S for TLS server
  * Q for P-initiated queries
  * R is for S Reply data
  * enc_key represents the key of the encrypted data in TLS
  * mac_key represents the MAC key in TLS 
  * t stands for summary (Digest)

## Related Technologies  
  * TLS: Secure Transport Layer Protocol, a protocol used to provide confidentiality and data integrity between two communicating applications. tls is the cornerstone of communication in the web world.
  
  * MPC: Secure Multiparty Computation, which allows multiple participants to jointly participate in the computation without revealing their privacy, here mainly uses obfuscated circuits and optimized fast multiparty computation ECDSA algorithms.
  
  * ZKP: Zero Knowledge Proof, which refers to the ability of a prover to convince a verifier that an assertion is correct without providing any useful information to the verifier, and the specific implementation will use the PLONK algorithm.
    
## Three Stages:
  * Multi-party handshake.
    * P gets (tid, uri, assert) from V. uri is the api of the query and assert is the result assertion.
    * {P, V} performs a three-way handshake with the TLS server, P authenticates the CA first, P sends $(r_c,r_s,pk_s,ca,digest)$ to V.
    * V verifies CA and digest, V samples$F_v \mapsto S_v$ , Yv = Sv * G. Send Yv to P.
    * P samples$F_p \mapsto S_p$ , Yp = Sp * G. Send  $Y_{vp}=Y_v+Y_p$ to S.
    * {P,V} calculate the session key and master secret by mpc.
      * Public Input: $nounce,r_c,r_s$
      * Private input: $z_p \in F_p from P;z_v \in F_p \ from \ V$
      * $z :=z_p+z_v$
      * $m :=PRF(z,"master secret",r_s || r_c)$
      * $enc\_key,mac\_key := PRF(m,"key partation",r_s || r_c)$
      * samples $F_p \mapsto r_k,r_m$ , send $(enc\_key,k_p,r_m)$ to P and send $(r_k \oplus mac\_key,r_m \oplus m)$ to V.
  * Data query.
    * P assembles Q by filling the password (token) into uri, P computes the digest t by MPC-HMAC together with V, and then P sends (tid, Q'= Enc($enc\_key,Q||t$ )) to S.
  
  * Zero-knowledge proof.
    * P received a reply R' from the server
    * P sends $(tid,Q',R',mac\_key)$ to V.
    * V sends $(tid,mac\_key\_v)$ to P.
    * P calculate $mac\_key = mac\_key\_p+mac\_key\_v$ , P decrypts R||t = Dec($enc\_key,R'$), and verifies t.
    * Generate proof
      
      ```plain
      P set
        b= assert(R)
        x = (Q', R', mac_key, b) ;
        w = (enc_key, token, Q, R)
      
      }
      Constraints {
        Dec(enc_key, R') = R || t ;
        Verify(mac_key, t , R) = 1 ;
        b =assert(R)
        Q = uri(token);
      }
      ```
    
    * V verification proof.
      With ZKP, the user's privacy is guaranteed while providing proof for third parties; with MPC, the prover and verifier jointly hold the mac_key, ensuring that the prover cannot cheat; and all of this is built on the standard TLS protocol, without any changes to the server.

## Implementation
  The overall system architecture of zkPass is shown in the following figure.
![](/Users/koala/Work/ifdao/zkpass-contract/docs/images/2_architecture.jpg)

The overall system includes the following components.

 * zkPass Kit: The client of the zkPass protocol, which is an implementation of the provers (Prover) in the zkPass protocol. Business users select or customize a suitable KYC template according to their needs, configure the template into zkPass Kit in the form of parameters, and initiate KYC requests to the smart contract on the chain. In order to avoid repeated verification, zkPass Kit first goes to the ZKPass Backend to find out if this KYC authentication already exists in the zkPass ecology; if not, it is responsible for conducting MPC with the Nodes node selected for this KYC task, generating mac_key, and performing HMAC calculations on the messages in subsequent TLS communications The zkPass Kit can be loaded in the user's browser as a browser plug-in or integrated into the front-end service of an enterprise user as an SDK.

 * TheGraph: TheGraph is a protocol for querying and indexing blockchain network data. By generating subgraphs, the data on the chain is indexed so that data that is difficult to query directly can be queried. It makes on-chain data queries fast, reliable and secure. zkPass uses TheGraph protocol to index KYC requests and results on the chain for zkPass Backend queries. Note that TheGraph can only index on-chain data, i.e. KYC requests initiated by an address and KYC verification results corresponding to that address, and cannot access any private user data; users can even hide KYC verification results by configuring zkPass Kit's parameters to further protect their privacy.

 * zkPass Backend: By querying the KYC requests and results on the chain indexed by TheGraph and aggregating the open data of users corresponding to that address, it generates authentication cards for users, preventing duplicate KYC authentication, accelerating the KYC efficiency of the zkPass system, and improving the user experience.

 * Blockchain Smart Contract: An on-chain smart contract that consists of three components.
  * Template contract: The template for KYC verification contains assert, query and their corresponding parameters. Business users can configure the template with parameters such as age over 18 (age is a parameter) and twitter followers over 100 (followers is a parameter). The zkPass Kit allows business users to select the appropriate KYC template from the contract and use it. Business users and developers can also create new templates based on their needs, which will be added to the template contract after receiving confirmation from the community.
  * Task Manage contract: Receives KYC requests from zkPass Kit, generates tid (task id), randomly selects k nodes (k>=1) from the registered nodes (or as specified by the enterprise user's configuration), and returns node information to zkPass Kit for subsequent MPC.
  * ZK Verification contract: After zkPass Kit completes commit, it accepts ZKP submitted by zkPass Kit, verifies the validity of ZKP, and returns the verification result.

* Node Cluster: The consensus node network is an implementation of the Verifier in the zkPass protocol. When a user invokes the on-chain smart contract interface to initiate a KYC request, the nodes in this network listen to the Task Manage contract to determine whether they are selected to participate in subsequent KYC tasks; when selected, they wait for the request initiated by zkPass Kit, participate in the subsequent multi-party handshake, query data, and disclose the mac_key held after ZKP submission. it should be noted that When the enterprise user turns on random mode to select nodes, in order to prevent individual nodes from being evil, multiple nodes are randomly selected in the Task Manage contract to participate in the MPC of the zkPass protocol. It is easy to see from the zkPass protocol that as long as there is an honest node participating in this KYC task, the certainty of this KYC task can be guaranteed; the enterprise user can also run their own KYC node and specify the choice of that node in the KYC task, making subsequent MPCs degenerate to 2PC.

* Web2 Issuers: The identity issuer's server, which satisfies the TLS protocol, is sufficient for the user to obtain identity information from the server. A complete KYC authentication process can be described as follows: 
  the business user obtains (creates) a template from the chain, configures parameters related to the KYC authentication template, and integrates it into its front-end service; 
  the user accesses the business user's front-end service, brings up the zkPass Kit, and initiates a KYC request to the chain contract based on the template specified in that front-end service; 
  the chain contract receives the KYC request, generates a tid The on-chain contract receives the KYC request, generates the tid, randomizes (or specifies) the nodes participating in the MPC, and returns the tid and node information to zkPass Kit; 
  zkPass Kit, the selected nodes, and the identity issuer server start the multi-party handshake and data query according to the zkPass protocol, and generate the ZKP; 
  zkPass Kit sends the generated zero-knowledge proof The ZKPass Kit sends the generated zero-knowledge proofs to the on-chain verification contract for verification; 
  the mac_keys of the selected nodes in this task are used as part of the public input for this ZKP verification;
  the on-chain verification contract performs the verification process based on all the submitted public input, wisdom and proof, and returns the verification result of this KYC. The on-chain validation contract performs the validation process based on all the submitted public inputs, witeness and proof, and returns the KYC validation result.

* **Implementation on Mina Protocol**: zkApp uses Typescript to implement zero-knowledge proof, which is more friendly to developers; Mina's zero-knowledge is based on PLONK algorithm with constant proof size, which is suitable for authentication application scenarios. Since the verification message digest uses the CBC-HMAC algorithm, here we need to implement our own CBC-HMAC algorithm circuit. p inherit Circuit to create the circuit, private input (Q', R', mac_key, b), public input (enc_key, token, Q, R), and also create the verificationKey to send to the contract. v Inherit SmartContract to create verification contract, receive verificationKey from P and proof verify if it passes.
 
