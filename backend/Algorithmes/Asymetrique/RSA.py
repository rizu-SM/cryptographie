import random

# -------------------- 1. TEST DE PRIMALITE (Miller-Rabin) --------------------
def is_prime(n, k=20):
    """Test de primalite Miller-Rabin (k rounds)"""
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False

    # Ecrire n-1 = 2^r * d
    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2

    for _ in range(k):
        a = random.randrange(2, n - 1)
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


# -------------------- 2. GENERATION DE NOMBRE PREMIER --------------------
def generate_prime(bits):
    """Genere un nombre premier aleatoire de `bits` bits"""
    while True:
        n = random.getrandbits(bits)
        n |= (1 << (bits - 1)) | 1   # MSB=1 (taille exacte), LSB=1 (impair)
        if is_prime(n):
            return n


# -------------------- 3. ALGORITHME D'EUCLIDE ETENDU --------------------
def gcd(a, b):
    """PGCD simple"""
    while b:
        a, b = b, a % b
    return a


def extended_gcd(a, b):
    """Retourne (gcd, x, y) tel que a*x + b*y = gcd"""
    if a == 0:
        return b, 0, 1
    g, x1, y1 = extended_gcd(b % a, a)
    return g, y1 - (b // a) * x1, x1


def mod_inverse(e, phi):
    """Inverse modulaire de e modulo phi"""
    g, x, _ = extended_gcd(e % phi, phi)
    if g != 1:
        raise ValueError("L'inverse modulaire n'existe pas (gcd != 1)")
    return x % phi


# -------------------- 4. CONSTRUCTION DES CLES --------------------
def _build_keys(p, q):
    """
    Construit la paire de cles RSA a partir de p et q.
    Retourne un dictionnaire complet avec toutes les valeurs intermediaires.
    """
    n   = p * q
    phi = (p - 1) * (q - 1)

    # Choisir e tel que 1 < e < phi et gcd(e, phi) = 1
    e = 2
    while e < phi and gcd(e, phi) != 1:
        e += 1

    # Calculer d = e^-1 mod phi
    d = mod_inverse(e, phi)

    return {
        "p":   p,
        "q":   q,
        "n":   n,
        "phi": phi,
        "public_key":  {"n": n, "e": e},
        "private_key": {"n": n, "d": d}
    }


def generate_keys(bits=1024):
    """Genere une paire de cles RSA avec des premiers aleatoires (grands nombres)"""
    p = generate_prime(bits // 2)
    q = generate_prime(bits // 2)
    while q == p:
        q = generate_prime(bits // 2)
    return _build_keys(p, q)


def generate_keys_from_pq(p, q):
    """
    Genere une paire de cles RSA a partir de p et q fournis.
    Fonctionne avec des petits premiers (ex: p=7, q=11).
    """
    if not is_prime(p):
        raise ValueError(f"{p} n'est pas un nombre premier")
    if not is_prime(q):
        raise ValueError(f"{q} n'est pas un nombre premier")
    if p == q:
        raise ValueError("p et q doivent etre differents")
    return _build_keys(p, q)


# -------------------- 5. CHIFFREMENT RSA DIRECT (sans padding) --------------------
def rsa_encrypt_int(m, n, e):
    """Chiffre un entier m : c = m^e mod n  (m doit etre < n)"""
    if m >= n:
        raise ValueError(f"Le message ({m}) doit etre < n ({n})")
    return pow(m, e, n)


def rsa_decrypt_int(c, n, d):
    """Dechiffre un entier c : m = c^d mod n"""
    return pow(c, d, n)


def rsa_encrypt(message, n, e):
    """
    Chiffre un message texte caractere par caractere (valeur ASCII).
    Chaque code ASCII doit etre < n.
    Retourne une liste d'entiers chiffres.
    """
    if isinstance(n, str):
        n = int(n, 16) if n.startswith("0x") else int(n)
    if isinstance(e, str):
        e = int(e, 16) if e.startswith("0x") else int(e)

    result = []
    for ch in message:
        m = ord(ch)
        if m >= n:
            raise ValueError(
                f"Le caractere '{ch}' (ASCII={m}) depasse n={n}. "
                "Choisissez des premiers plus grands."
            )
        result.append(rsa_encrypt_int(m, n, e))
    return result   # liste d'entiers


def rsa_decrypt(ciphertext, n, d):
    """
    Dechiffre une liste d'entiers.
    Retourne le message en clair (string).
    """
    if isinstance(n, str):
        n = int(n, 16) if n.startswith("0x") else int(n)
    if isinstance(d, str):
        d = int(d, 16) if d.startswith("0x") else int(d)

    return "".join(chr(rsa_decrypt_int(c, n, d)) for c in ciphertext)


# -------------------- TEST --------------------
if __name__ == "__main__":
    # --- Exemple avec petits premiers ---
    print("=" * 50)
    print("RSA avec petits premiers : p=7, q=11")
    print("=" * 50)
    keys = generate_keys_from_pq(7, 11)
    print(f"  p          = {keys['p']}")
    print(f"  q          = {keys['q']}")
    print(f"  n  = p*q   = {keys['n']}")
    print(f"  phi(n)     = {keys['phi']}")
    print(f"  Cle pub    : (n={keys['public_key']['n']}, e={keys['public_key']['e']})")
    print(f"  Cle priv   : (n={keys['private_key']['n']}, d={keys['private_key']['d']})")

    m = 5
    n = keys['public_key']['n']
    e = keys['public_key']['e']
    d = keys['private_key']['d']

    c  = rsa_encrypt_int(m, n, e)
    m2 = rsa_decrypt_int(c, n, d)
    print(f"\n  m={m}  ->  c = {m}^{e} mod {n} = {c}  ->  dechiffre = {m2}")
    assert m == m2, "Erreur de dechiffrement !"

