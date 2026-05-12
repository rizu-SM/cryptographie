import secrets


def is_prime(n, k=20):
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False

    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2

    for _ in range(k):
        a = 2 + secrets.randbelow(n - 3)
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True


def gcd(a, b):
    while b:
        a, b = b, a % b
    return a


def extended_gcd(a, b):
    if a == 0:
        return b, 0, 1
    g, x1, y1 = extended_gcd(b % a, a)
    return g, y1 - (b // a) * x1, x1


def mod_inverse(a, p):
    g, x, _ = extended_gcd(a % p, p)
    if g != 1:
        raise ValueError("L'inverse multiplicatif n'existe pas")
    return x % p


def generate_prime(bits):
    while True:
        n = secrets.randbits(bits)
        n |= (1 << (bits - 1)) | 1
        if is_prime(n):
            return n


def generate_p_with_large_prime_factor(bits=32):
    while True:
        q = generate_prime(bits - 1)
        p = 2 * q + 1
        if is_prime(p):
            return p


def prime_factors(n):
    factors = set()
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors.add(d)
            n //= d
        d += 1 if d == 2 else 2
    if n > 1:
        factors.add(n)
    return factors


def is_generator(g, p):
    if not (0 < g < p) or gcd(g, p) != 1:
        return False
    for q in prime_factors(p - 1):
        if pow(g, (p - 1) // q, p) == 1:
            return False
    return True


def find_generator(p):
    for g in range(2, p):
        if is_generator(g, p):
            return g
    raise ValueError("Aucun generateur trouve pour p")


def generate_keys(bits=32, p=None, g=None, s=None):
    if p is None:
        p = generate_p_with_large_prime_factor(bits)
    else:
        p = int(p)
        if not is_prime(p):
            raise ValueError("p doit etre un nombre premier")

    if g is None:
        g = find_generator(p)
    else:
        g = int(g)
        if not is_generator(g, p):
            raise ValueError("g doit verifier g^z != 1 mod p pour tout z dans 1...p-2")

    if s is None:
        s = 1 + secrets.randbelow(p - 2)
    else:
        s = int(s)
        if not (1 <= s <= p - 2):
            raise ValueError("s doit etre dans 1...p-2")

    y = pow(g, s, p)

    return {
        "public_key": {"y": y, "g": g, "p": p},
        "private_key": {"s": s},
    }


def elgamal_encrypt_int(M, y, g, p, k=None):
    M = int(M)
    y = int(y)
    g = int(g)
    p = int(p)

    if not (0 <= M < p):
        raise ValueError("M doit etre dans 0...p-1")

    if k is None:
        k = 1 + secrets.randbelow(p - 2)
    else:
        k = int(k)
        if not (1 <= k <= p - 2):
            raise ValueError("k doit etre dans 1...p-2")

    C1 = pow(g, k, p)
    C2 = (M * pow(y, k, p)) % p
    return C1, C2


def elgamal_decrypt_int(C1, C2, s, p):
    C1 = int(C1)
    C2 = int(C2)
    s = int(s)
    p = int(p)

    R = pow(C1, s, p)
    R_inverse = mod_inverse(R, p)
    M = (C2 * R_inverse) % p
    return M

