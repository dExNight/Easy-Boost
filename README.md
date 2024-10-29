# Staking System with Boost Mechanisms (TON Blockchain)

## Overview
`Easy Boost` is extension for JVault staking smart contract that allows users to boost their rewards temporarily by participating in "boost" events. Boosts offer additional token rewards for a limited period, encouraging users to stake tokens for a long time

## Boost Mechanics and Workflow

1. **Boost Initialization**: A boost is created by user or token owner. Boost creator specifies the boost duration and total token rewards supply. Only users that had active staking positions before creation of the boost are eligible to claim boost rewards

2. **Boost Expiration**: When the specified end time elapses, the boost concludes, and rewards become available to claim for eligible users

3. **User Claiming Process**: Eligible users sends claim request to receive boost rewards:
   - **Claim Verification**: The boost validates the claim, then notifies a `boost_helper` contract to ensure no duplicate claims are made by a single user
   - **Reward Distribution**: Upon verification, the boost smart contract processes the claim and sends the payment to user

---

## System Rules and Constraints

- **NFT withdrawal restriction**: Users who withdraw their staked NFT before the boost ends are ineligible for boost rewards. However, if they withdraw tokens from the main pool, they remain eligible for boost rewards if their withdrawal happened after the boost end date. The `withdrawed_at` parameter in each `nft_item` ensures claims are valid only if the NFT was held through the entire boost period
