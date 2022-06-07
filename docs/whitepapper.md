# zkPass Protocol

## Overview
  zkPass is a decentralized KYC solution based on MPC (Multi-Party Computation) and ZKP, which aims to overcome various flaws in the current KYC system, eliminate the pain points related to identity verification, and protect user privacy while expanding KYC capabilities.

## Related Technologies  
  * TLS: Secure Transport Layer Protocol, a protocol used to provide confidentiality and data integrity between two communicating applications. tls is the cornerstone of communication in the web world.
  
  * MPC: Secure Multiparty Computation, which allows multiple participants to jointly participate in the computation without revealing their privacy, here mainly uses obfuscated circuits and optimized fast multiparty computation ECDSA algorithms.
  
  * ZKP: Zero Knowledge Proof, which refers to the ability of a prover to convince a verifier that an assertion is correct without providing any useful information to the verifier, and the specific implementation will use the PLONK algorithm.

## Definitions
  * P stands for prover
  * V stands for verifier
  * S stands for TLS server
  * Q stands for P-initiated queries
  * R stands for S Reply data
  * enc_key represents the key of the encrypted data in TLS
  * mac_key represents the MAC key in TLS 
  * t stands for Digest

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
      * $ mac\_key$  $ mac\\_key$ $mac_\_key$  $ mac__key$
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

## Implementation On Mina
  zkApp uses Typescript to implement zero-knowledge proof, which is more friendly to developers; Mina's zero-knowledge is based on PLONK algorithm with constant proof size, which is suitable for authentication application scenarios. Since the verification message digest uses the CBC-HMAC algorithm, here we need to implement our own CBC-HMAC algorithm circuit. p inherit Circuit to create the circuit, private input (Q', R', mac_key, b), public input (enc_key, token, Q, R), and also create the verificationKey to send to the contract. v Inherit SmartContract to create verification contract, receive verificationKey from P and proof verify if it passes.
 
