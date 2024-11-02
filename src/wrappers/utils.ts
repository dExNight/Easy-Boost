export const decimals: number = 9;

export const amountToJettons = (amount: number | bigint): bigint => {
    return BigInt(amount) * BigInt(10 ** decimals);
};

export const timestamp = () => {
    return Math.floor(Date.now() / 1000);
};
