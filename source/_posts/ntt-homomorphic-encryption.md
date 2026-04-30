---
title: 同态加密中的 NTT——从多项式乘法到数论变换
date: 2026-04-30
tags: [技术]
mathjax: true
---

如果你看过全同态加密的实现（BFV、BGV、CKKS），一定会反复遇到一个词：**NTT（Number Theoretic Transform，数论变换）**。它是 FHE 性能的核心，没有它，同态加密的多项式运算会慢到不可用。

这篇文章从零讲清楚 NTT 是什么、为什么用它、以及它在同态加密里到底干了什么。

## 问题：多项式乘法的瓶颈

基于 RLWE 的同态加密方案里，密文是多项式，明文也是多项式。加密、解密、同态加法、同态乘法——所有操作都发生在多项式环上：

$$
R_q = \mathbb{Z}_q[x] / (x^N + 1)
$$

其中 $N$ 通常是 1024、2048、4096，甚至 32768。

直接做两个 $N$ 次多项式的卷积乘法，复杂度是 $O(N^2)$。对 $N=4096$ 来说，一次乘法就是 1600 万次模乘——这只是**一次**操作。实际 HE 方案中要做几十上百次这样的乘法，再加上重线性化和自举，计算量会爆炸。

## NTT 的思路：换个坐标系算

FFT 的经典思路：多项式有两种表示方式。

**系数表示**（coefficient representation）：
$$A(x) = a_0 + a_1x + a_2x^2 + \cdots + a_{N-1}x^{N-1}$$

**点值表示**（evaluation representation）：
$$A(x) \rightarrow \{(x_0, A(x_0)), (x_1, A(x_1)), \ldots, (x_{N-1}, A(x_{N-1}))\}$$

系数表示下，$A(x) \cdot B(x)$ 需要 $O(N^2)$。但点值表示下，只需要 $N$ 次逐点乘法——$O(N)$。

FFT 的作用就是在两种表示之间高效转换：$O(N \log N)$ 把系数变成点值，$O(N)$ 逐点乘，$O(N \log N)$ 把结果变回系数。总复杂度 $O(N \log N)$。

**NTT 就是有限域上的 FFT。** 把复数单位根 $\omega = e^{2\pi i / N}$ 替换成模 $q$ 下的本原 $2N$ 次单位根。

## 数学核心：有限域里的单位根

FFT 能工作，靠的是复数域中单位根的两个性质：
1. $\omega^N = 1$
2. $\omega^{N/2} = -1$（折半引理）

NTT 需要模 $q$ 的有限域 $\mathbb{Z}_q$ 中找一个等价的元素：一个整数 $\omega$ 满足 $\omega^N \equiv 1 \pmod{q}$，且 $\omega^{N/2} \equiv -1 \pmod{q}$。

这样的 $\omega$ 存在的充要条件是：$q \equiv 1 \pmod{2N}$。

这就是为什么同态加密方案里的模数都很"讲究"——比如 CKKS 的模数都是 `2N | q-1` 这种形式的素数。不是随便挑的素数都能拿来用。

一旦找到了 $\omega$，NTT 的正变换和逆变换跟 FFT 的分治结构一模一样：

**正变换（NTT）**——系数 → 点值，蝴蝶操作使用 $\omega$ 的幂次：

```
for len = 2, 4, 8, ..., N:
    for i = 0, len/2:
        u = a[i]
        v = a[i + len/2] * ω_root
        a[i]         = u + v  (mod q)
        a[i + len/2] = u - v  (mod q)
```

**逆变换（INTT）**——点值 → 系数，蝴蝶操作使用 $\omega^{-1}$ 的幂次，最后乘 $N^{-1} \pmod{q}$。

## 在 HE 里到底怎么用的

以 BFV 为例，两个密文多项式 $ct_0, ct_1$ 相乘的流程：

```
1. NTT(ct_0)   →  ct_0 的 NTT 表示
2. NTT(ct_1)   →  ct_1 的 NTT 表示
3. 逐点乘       →  ct_0[i] * ct_1[i] mod q  (O(N))
4. INTT(result) →  变回系数表示
```

总复杂度：两次正变换 + N 次模乘 + 一次逆变换 = $O(N \log N)$。

实际实现中还有一个关键优化——**负包裹卷积**（negacyclic convolution）。多项式环是 `x^N + 1` 而不是 `x^N - 1`，这需要在变换前后做一次"扭转"（twisting）：

- NTT 之前：$a_i \leftarrow a_i \cdot \psi^i$
- INTT 之后：$a_i \leftarrow a_i \cdot \psi^{-i}$

其中 $\psi$ 是 $\omega = \psi^2$ 的本原 $2N$ 次根。这个预处理让循环卷积自动变成负包裹卷积，对齐环的模关系 $x^N + 1$。

## 一个 Python 示例

下面用 Python 写一个最小可跑的 NTT（不做任何优化，纯粹展示结构）：

```python
def ntt(a, q, w):
    """a 是系数列表(长度 N=2^k)，q 是模数，w 是N次本原根"""
    n = len(a)
    # 迭代版 Cooley-Tukey
    m = n
    while m > 1:
        m //= 2
        wm = pow(w, m, q)  # w^m mod q
        for i in range(0, n, 2 * m):
            w_pow = 1
            for j in range(m):
                u = a[i + j]
                v = a[i + j + m] * w_pow % q
                a[i + j]     = (u + v) % q
                a[i + j + m] = (u - v) % q
                w_pow = w_pow * wm % q
    return a


def intt(a, q, w):
    """逆 NTT，返回系数表示"""
    n = len(n)
    inv_n = pow(n, -1, q)      # n^{-1} mod q
    inv_w = pow(w, -1, q)      # w^{-1} mod q
    a = ntt(a, q, inv_w)       # 用 w^{-1} 做正变换
    return [x * inv_n % q for x in a]


def poly_mul(a, b, q, w):
    """NTT 加速多项式乘法"""
    a_ntt = ntt(a[:], q, w)
    b_ntt = ntt(b[:], q, w)
    c_ntt = [x * y % q for x, y in zip(a_ntt, b_ntt)]
    return intt(c_ntt, q, w)


# 示例参数（q=97, N=4, w=33）
# 验证: 33^4 = 1185921 ≡ 1 (mod 97), 33^2 = 1089 ≡ 22 ≠ 1 (mod 97)
q, N, w = 97, 4, 33
a = [1, 2, 3, 4]
b = [5, 6, 7, 8]
c = poly_mul(a, b, q, w)
print("NTT 乘法结果:", c)
```

实际工程中（OpenFHE、SEAL、Lattigo 等库），NTT 高度优化：使用了位逆序重排、SIMD 向量化、预计算旋转因子表、甚至 GPU 加速。但核心结构和上面一样。

## NTT 的局限和替代

NTT 不是万能的。它的主要限制：

1. **模数必须满足 $q \equiv 1 \pmod{2N}$**，这限制了参数选择。非 NTT 友好的素数就不能用。
2. **只适用于 2 的幂次**，$N$ 通常是 2 的幂。
3. **对自举不够友好**——自举需要更大规模的多项式运算，有些方案开始用 GSM（Galois Summation Method）等替代方案。

对于非 2 的幂次或非标准模数的情况，有混合基 NTT（mixed-radix NTT）、ECFFT（elliptic curve FFT）等替代品，但那是另一个话题了。

## 总结

NTT 是同态加密性能的基石。一句话概括：

> 把 $O(N^2)$ 的多项式乘法变成 $O(N \log N)$，靠的是在有限域里找到一个"单位根"，然后用和 FFT 完全相同的分治策略。

理解了 NTT，就理解了为什么 HE 方案要那样选参数，以及为什么"一次同态乘法"的计算成本是可以接受的。
