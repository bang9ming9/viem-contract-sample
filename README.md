yarn 으로 패키지 의존성 가져오시면 됩니다.<br>
왠지 모르게 npm 은 viem 을 가져오는데 실패하네요;;<br>

case1, case2 함수 를 구분하여 사용했습니다.`src/App.txs` 에서 변경하면서 확인할 수 있습니다. <br>
코드는 `src/viem.ts` 를 확인해주세요<br>

- case1: 컨트랙트 객체 위주로 상호작용
- case2: walletClient 객체 위주로 상호작용
*개인적으로는 case2 의 방식이 좀 더 좋을것 같습니다.*<br>
개발자도구 console 을 사용해서 결과를 확인해 주세요.
receipt 을 가져오는 부분은 약 12초의 시간이 걸립니다...!

```bash
git clone https://github.com/bang9ming9/viem-contract-sample
yarn install
yarn start
```
