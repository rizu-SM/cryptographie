import secrets

from Algorithmes.Asymetrique.ElGamal import (
    find_generator,
    generate_p_with_large_prime_factor,
    is_generator,
    is_prime,
)


def _parse_int(value, name):
    if isinstance(value, str):
        return int(value, 16) if value.startswith("0x") else int(value)
    if isinstance(value, int):
        return value
    raise ValueError(f"Le champ '{name}' doit etre un entier")


def generate_parameters(bits=32, p=None, g=None):
    """
    Genere les parametres publics Diffie-Hellman.
    p est premier et g est un generateur modulo p.
    """
    if p is None:
        p = generate_p_with_large_prime_factor(bits)
    else:
        p = _parse_int(p, "p")
        if not is_prime(p):
            raise ValueError("p doit etre un nombre premier")

    if g is None:
        g = find_generator(p)
    else:
        g = _parse_int(g, "g")
        if not is_generator(g, p):
            raise ValueError("g doit etre un generateur modulo p")

    return {"p": p, "g": g}


def generate_private_key(p, private_key=None):
    p = _parse_int(p, "p")

    if private_key is None:
        return 2 + secrets.randbelow(p - 3)

    private_key = _parse_int(private_key, "private_key")
    if not (2 <= private_key <= p - 2):
        raise ValueError("La cle privee doit etre dans 2...p-2")
    return private_key


def generate_public_key(g, p, private_key):
    g = _parse_int(g, "g")
    p = _parse_int(p, "p")
    private_key = _parse_int(private_key, "private_key")
    return pow(g, private_key, p)


def compute_shared_secret(other_public_key, private_key, p):
    other_public_key = _parse_int(other_public_key, "other_public_key")
    private_key = _parse_int(private_key, "private_key")
    p = _parse_int(p, "p")

    if not (1 < other_public_key < p):
        raise ValueError("La cle publique recue doit etre dans 2...p-1")

    return pow(other_public_key, private_key, p)


def diffie_hellman_exchange(bits=32, p=None, g=None, alice_private=None, bob_private=None):
    """
    Echange complet:
    A choisit a, calcule A = g^a mod p.
    B choisit b, calcule B = g^b mod p.
    A calcule K_A = B^a mod p.
    B calcule K_B = A^b mod p.
    """
    params = generate_parameters(bits=bits, p=p, g=g)
    p = params["p"]
    g = params["g"]

    a = generate_private_key(p, alice_private)
    b = generate_private_key(p, bob_private)
    alice_public = generate_public_key(g, p, a)
    bob_public = generate_public_key(g, p, b)
    alice_secret = compute_shared_secret(bob_public, a, p)
    bob_secret = compute_shared_secret(alice_public, b, p)

    return {
        "parameters": {"p": p, "g": g},
        "alice": {
            "private_key": a,
            "public_key": alice_public,
            "shared_secret": alice_secret,
            "formula_public": f"A = g^a mod p = {g}^{a} mod {p}",
            "formula_secret": f"K_A = B^a mod p = {bob_public}^{a} mod {p}",
        },
        "bob": {
            "private_key": b,
            "public_key": bob_public,
            "shared_secret": bob_secret,
            "formula_public": f"B = g^b mod p = {g}^{b} mod {p}",
            "formula_secret": f"K_B = A^b mod p = {alice_public}^{b} mod {p}",
        },
        "same_secret": alice_secret == bob_secret,
    }
