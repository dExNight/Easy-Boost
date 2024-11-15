## System architecture

### Smart contracts

1. **Pools Admin**
   - Centralized pool management contract
   - Responsible for creating and initializing new pools

2. **Staking Pool**
   - Implements staking logic
   - Handles boost creation and initialization

3. **NFT Item**
   - Represents user's staking position

4. **Boost**
   - Manages additional reward distribution

5. **Boost Helper**
   - Controls fair reward distribution for each position

## Mechanics

### Boost Creation

Any user can create a boost by specifying:
   - Boost duration
   - Amount of reward tokens
   - Reward token type