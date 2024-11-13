import {
    createWalletClient,
    http,
    getContract,
    createPublicClient, publicActions,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { holesky } from 'viem/chains'

const account = privateKeyToAccount("0x350fe3c2dcdb53dbccf771dc1f267735a8793933f2a7803858ec03b9c61a0fd9");
// address = 0x485235dF3616bB1bbf1e4Ae3AED0cccd8a8AA0F5
const erc20Address = '0xB0969Dd0CBd653a1552b29850C6Aeb60F1311159'
const IERC20Abi = [{ "type": "function", "name": "allowance", "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }, { "name": "spender", "type": "address", "internalType": "address" }], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "approve", "inputs": [{ "name": "spender", "type": "address", "internalType": "address" }, { "name": "value", "type": "uint256", "internalType": "uint256" }], "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }], "stateMutability": "nonpayable" }, { "type": "function", "name": "balanceOf", "inputs": [{ "name": "account", "type": "address", "internalType": "address" }], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "totalSupply", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "transfer", "inputs": [{ "name": "to", "type": "address", "internalType": "address" }, { "name": "value", "type": "uint256", "internalType": "uint256" }], "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }], "stateMutability": "nonpayable" }, { "type": "function", "name": "transferFrom", "inputs": [{ "name": "from", "type": "address", "internalType": "address" }, { "name": "to", "type": "address", "internalType": "address" }, { "name": "value", "type": "uint256", "internalType": "uint256" }], "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }], "stateMutability": "nonpayable" }, { "type": "event", "name": "Approval", "inputs": [{ "name": "owner", "type": "address", "indexed": true, "internalType": "address" }, { "name": "spender", "type": "address", "indexed": true, "internalType": "address" }, { "name": "value", "type": "uint256", "indexed": false, "internalType": "uint256" }], "anonymous": false }, { "type": "event", "name": "Transfer", "inputs": [{ "name": "from", "type": "address", "indexed": true, "internalType": "address" }, { "name": "to", "type": "address", "indexed": true, "internalType": "address" }, { "name": "value", "type": "uint256", "indexed": false, "internalType": "uint256" }], "anonymous": false }];

export const case1 = async () => {
    // 체인과 통신
    const client = createPublicClient({
        chain: holesky,
        transport: http()
    });

    // 지갑 객체 생성
    const wallet = createWalletClient({
        account, // 여기에 키 넣어서 서명이 필요한 시점에 알아서 해준다.
        chain: holesky,
        transport: http()
    });

    // @ts-ignore 컨트랙트 객체 생성
    const erc20 = getContract({
        address: erc20Address, // holesky 체인에서의 erc20 token address
        abi: IERC20Abi,
        client: { public: client, wallet: wallet }, // 여기에 wallet 을 넣어줘서 위에 넣은 private key 으로 서명을 한다
    })
    console.log({ erc20 });

    // call 은 컨트랙트 객체에 read 로 접근한다.
    let balance = await erc20.read.balanceOf([account.address]);
    console.log({ balance });

    // send transaction //
    // 1. send transaction 은 컨트랙트 객체에 write 으로 접근한다.
    // @dev gas 를 직접 입력하지 않아 estimateGas 를 호출하게 되면서, revert 가 예상되면 에러가 발생한다.
    let tx = await erc20.write.transfer([erc20.address, 0]); // function transfer(address to, uint256 value); // 설정된 개인키에는 잔액이 없어 값을 넣으면 (0 -> 1) 리버트가 발생한다.
    console.log({ tx });

    // @ts-ignore 2. get receipt
    let receipt = await client.waitForTransactionReceipt({ hash: tx });
    console.log({ receipt });
    console.log({ status: receipt.status }) // receipt.status 를 확인해야 해당 트랜잭션이 성공했는지, 안했는지 알 수 있다.
};

export const case2 = async () => {
    // 지갑 객체 생성
    const wallet = createWalletClient({
        account, // 여기에 키 넣어서 서명이 필요한 시점에 알아서 해준다.
        chain: holesky,
        transport: http() // @ts-ignore
    }).extend(publicActions); // publicActions 을 추가하여 publicClient 의 일부 기능을 사용할 수 있도록 한다.

    // @ts-ignore call 은 'readContract' 을 사용한다.
    let balance = await wallet.readContract({
        address: erc20Address,
        abi: IERC20Abi,
        functionName: 'balanceOf',
        args: [account.address],
    });

    console.log({ balance });

    // transaction 은 'writeContract' 을 사용한다.
    let tx = await wallet.writeContract({
        address: erc20Address,
        abi: IERC20Abi,
        functionName: 'transfer',
        args: [erc20Address, 1], // value 를 1으로 입력하여 실패를 유도한다.
        gas: 8e6, // [optional] gas 를 설정하여 estimateGas 를 호출하지 않으며, 예상되는 실패인지 알 수 없다.
        // gas 는 정확한 값을 요구하지 않으며, 같은 동작을 시켜도 상황에 따라 약간의 차이가 있을 수 있다.
        // estimateGas 은 블럭이 생성되기 전의 상황으로 계산한 값이어서 항상 정확하다고 할 수 없다.
        // 너무 큰 값을 입력하게 된다면 요청 자체가 실패할 수 있다.
    });
    console.log({ tx });

    let receipt = await wallet.waitForTransactionReceipt({ hash: tx });
    console.log({ receipt });
    console.log({ status: receipt.status, gas: receipt.gasUsed }) // receipt.status 를 확인해야 해당 트랜잭션이 성공했는지, 안했는지 알 수 있다.
    // writeContract 에서 gas(limit) 을 8e6 으로 설정해도, 결과적으로는 사용할만큼만 사용한다.
}