## 2024-05-18 - トーストコンポーネントにおける予測可能な乱数生成器の使用
**Vulnerability:** UIコンポーネント（Toast）のID生成に予測可能な乱数生成器（`Math.random()`）が使用されていました。
**Learning:** ブラウザやNode環境の`Math.random()`は暗号論的に安全ではないため、ID生成等で使用すると予測可能になり、場合によってはコリジョン等の問題を引き起こす可能性があります。
**Prevention:** 常に暗号論的に安全な乱数生成器を使用するよう心がけます。ブラウザ環境では`crypto.randomUUID()`を優先して使用し、非HTTPS環境等で`crypto`が利用できない場合のフォールバック（`typeof crypto !== "undefined" && crypto.randomUUID`）を含めるようにします。
