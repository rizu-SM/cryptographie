import hashlib
import secrets

from Algorithmes.Asymetrique.ElGamal import is_prime, mod_inverse


def _parse_int(value, name):
    if isinstance(value, str):
        return int(value, 16) if value.startswith("0x") else int(value)
    if isinstance(value, int):
        return value
    raise ValueError(f"Le champ '{name}' doit etre un entier")


def _hash_message(message, hash_algorithm="sha256"):
    if not isinstance(message, str):
        raise ValueError("Le message doit etre une chaine de caracteres")

    algorithm = (hash_algorithm or "sha256").lower()
    if algorithm == "md4":
        from Algorithmes.Hachage.MD4 import md4_hash
        return md4_hash(message)

    if algorithm not in ("md5", "sha1", "sha256", "sha512"):
        raise ValueError("hash_algorithm doit etre md4, md5, sha1, sha256 ou sha512")

    return hashlib.new(algorithm, message.encode("utf-8")).hexdigest()


def _validate_parameters(p, q, g=None):
    if not is_prime(q):
        raise ValueError("q doit etre un nombre premier")
    if not is_prime(p):
        raise ValueError("p doit etre un nombre premier")
    if (p - 1) % q != 0:
        raise ValueError("q doit diviser p-1")
    if g is not None:
        if not (1 < g < p):
            raise ValueError("g doit etre dans 2...p-1")
        if pow(g, q, p) != 1:
            raise ValueError("g doit verifier g^q mod p = 1")


def _find_generator(p, q, h=None):
    exponent = (p - 1) // q

    if h is not None:
        h = _parse_int(h, "h")
        if not (2 <= h <= p - 2):
            raise ValueError("h doit etre dans 2...p-2")
        g = pow(h, exponent, p)
        if g <= 1:
            raise ValueError("h donne g <= 1, choisissez un autre h")
        return g

    for candidate in range(2, p - 1):
        g = pow(candidate, exponent, p)
        if g > 1:
            return g

    raise ValueError("Aucun generateur DSA trouve")


def generate_keys(p=None, q=None, g=None, x=None, h=None):
    """
    Genere des cles DSA educatives.
    Parametres publics: p, q, g
    Cle privee: x dans 1...q-1
    Cle publique: y = g^x mod p
    """
    if p is None and q is None:
        p = 467
        q = 233
    elif p is None or q is None:
        raise ValueError("Les deux champs 'p' et 'q' sont requis ensemble")

    p = _parse_int(p, "p")
    q = _parse_int(q, "q")
    g = None if g is None else _parse_int(g, "g")
    _validate_parameters(p, q, g)

    if g is None:
        g = _find_generator(p, q, h)

    if x is None:
        x = 1 + secrets.randbelow(q - 1)
    else:
        x = _parse_int(x, "x")
        if not (1 <= x <= q - 1):
            raise ValueError("x doit etre dans 1...q-1")

    y = pow(g, x, p)

    return {
        "public_key": {"p": p, "q": q, "g": g, "y": y},
        "private_key": {"x": x},
    }


def _choose_k(q):
    return 1 + secrets.randbelow(q - 1)


def dsa_sign(message, p, q, g, x, k=None, hash_algorithm="sha256"):
    """
    Signature DSA:
    r = (g^k mod p) mod q
    s = k^-1(H(m) + x*r) mod q
    signature = (r, s)
    """
    p = _parse_int(p, "p")
    q = _parse_int(q, "q")
    g = _parse_int(g, "g")
    x = _parse_int(x, "x")
    _validate_parameters(p, q, g)

    if not (1 <= x <= q - 1):
        raise ValueError("x doit etre dans 1...q-1")

    digest = _hash_message(message, hash_algorithm)
    hash_int = int(digest, 16)
    hash_mod_q = hash_int % q

    if k is not None:
        k = _parse_int(k, "k")
        if not (1 <= k <= q - 1):
            raise ValueError("k doit etre dans 1...q-1")
        r = pow(g, k, p) % q
        if r == 0:
            raise ValueError("r vaut 0, choisissez un autre k")
        k_inverse = mod_inverse(k, q)
        s = (k_inverse * (hash_int + x * r)) % q
        if s == 0:
            raise ValueError("s vaut 0, choisissez un autre k")
    else:
        while True:
            k = _choose_k(q)
            r = pow(g, k, p) % q
            if r == 0:
                continue
            k_inverse = mod_inverse(k, q)
            s = (k_inverse * (hash_int + x * r)) % q
            if s != 0:
                break

    return {
        "message": message,
        "hash_algorithm": (hash_algorithm or "sha256").lower(),
        "hash": digest,
        "hash_int": hash_int,
        "hash_mod_q": hash_mod_q,
        "k": k,
        "k_inverse": k_inverse,
        "r": r,
        "s": s,
        "signature": {"r": r, "s": s},
        "formula_r": f"r = (g^k mod p) mod q = ({g}^{k} mod {p}) mod {q}",
        "formula_s": "s = k^-1(H(m) + x*r) mod q",
    }


def dsa_verify(message, r, s, p, q, g, y, hash_algorithm="sha256"):
    """
    Verification DSA:
    1. verifier r et s dans [1, q-1]
    2. w = s^-1 mod q
    3. u = w*H(m) mod q
    4. v = r*w mod q
    5. z = ((g^u * y^v) mod p) mod q
    6. accepter si z = r
    """
    p = _parse_int(p, "p")
    q = _parse_int(q, "q")
    g = _parse_int(g, "g")
    y = _parse_int(y, "y")
    r = _parse_int(r, "r")
    s = _parse_int(s, "s")
    _validate_parameters(p, q, g)

    digest = _hash_message(message, hash_algorithm)
    hash_int = int(digest, 16)
    hash_mod_q = hash_int % q
    range_valid = 1 <= r <= q - 1 and 1 <= s <= q - 1

    if range_valid:
        w = mod_inverse(s, q)
        u = (w * hash_int) % q
        v = (r * w) % q
        z = ((pow(g, u, p) * pow(y, v, p)) % p) % q
    else:
        w = None
        u = None
        v = None
        z = None

    return {
        "message": message,
        "hash_algorithm": (hash_algorithm or "sha256").lower(),
        "hash": digest,
        "hash_int": hash_int,
        "hash_mod_q": hash_mod_q,
        "range_valid": range_valid,
        "w": w,
        "u": u,
        "v": v,
        "z": z,
        "valid": range_valid and z == r,
        "formula_z": "z = ((g^u * y^v) mod p) mod q",
    }
