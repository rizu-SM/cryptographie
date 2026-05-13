import secrets

from Algorithmes.Asymetrique.ElGamal import is_prime, mod_inverse


def _parse_int(value, name):
    if isinstance(value, str):
        return int(value, 16) if value.startswith("0x") else int(value)
    if isinstance(value, int):
        return value
    raise ValueError(f"Le champ '{name}' doit etre un entier")


def _next_prime(n):
    candidate = max(2, int(n))
    if candidate % 2 == 0 and candidate != 2:
        candidate += 1

    while not is_prime(candidate):
        candidate += 1 if candidate == 2 else 2
    return candidate


def _evaluate_polynomial(coefficients, x, prime):
    value = 0
    power = 1

    for coefficient in coefficients:
        value = (value + coefficient * power) % prime
        power = (power * x) % prime

    return value


def _normalize_share(share):
    if isinstance(share, dict):
        return _parse_int(share.get("x"), "x"), _parse_int(share.get("y"), "y")
    if isinstance(share, (list, tuple)) and len(share) == 2:
        return _parse_int(share[0], "x"), _parse_int(share[1], "y")
    raise ValueError("Chaque part doit etre {'x': ..., 'y': ...} ou [x, y]")


def split_secret(secret, threshold, num_shares, prime=None, coefficients=None, x_values=None):
    """
    Partage de secret de Shamir.
    Le secret est f(0). On cree un polynome aleatoire de degre threshold - 1:
    f(x) = secret + a1*x + ... + a(t-1)*x^(t-1) mod prime
    """
    secret = _parse_int(secret, "secret")
    threshold = _parse_int(threshold, "threshold")
    num_shares = _parse_int(num_shares, "num_shares")

    if threshold < 2:
        raise ValueError("threshold doit etre >= 2")
    if num_shares < threshold:
        raise ValueError("num_shares doit etre >= threshold")

    if prime is None:
        prime = _next_prime(max(secret + 1, num_shares + 1, 2089))
    else:
        prime = _parse_int(prime, "prime")
        if not is_prime(prime):
            raise ValueError("prime doit etre un nombre premier")

    if not (0 <= secret < prime):
        raise ValueError("Le secret doit etre dans 0...prime-1")
    if num_shares >= prime:
        raise ValueError("num_shares doit etre < prime")

    if coefficients is None:
        coefficients = [secret] + [secrets.randbelow(prime) for _ in range(threshold - 1)]
    else:
        coefficients = [_parse_int(value, "coefficient") % prime for value in coefficients]
        if len(coefficients) != threshold - 1:
            raise ValueError("coefficients doit contenir threshold-1 valeurs")
        coefficients = [secret] + coefficients

    if x_values is None:
        x_values = list(range(1, num_shares + 1))
    else:
        x_values = [_parse_int(value, "x") for value in x_values]
        if len(x_values) != num_shares:
            raise ValueError("x_values doit contenir num_shares valeurs")

    if len(set(x_values)) != len(x_values):
        raise ValueError("Les valeurs x doivent etre distinctes")
    if any(x <= 0 or x >= prime for x in x_values):
        raise ValueError("Chaque x doit etre dans 1...prime-1")

    shares = [
        {"x": x, "y": _evaluate_polynomial(coefficients, x, prime)}
        for x in x_values
    ]

    return {
        "secret": secret,
        "threshold": threshold,
        "num_shares": num_shares,
        "prime": prime,
        "coefficients": coefficients,
        "polynomial": _format_polynomial(coefficients, prime),
        "shares": shares,
    }


def reconstruct_secret(shares, prime):
    """
    Reconstruit f(0) par interpolation de Lagrange:
    secret = somme y_i * produit((-x_j)/(x_i - x_j)) mod prime
    """
    prime = _parse_int(prime, "prime")
    if not is_prime(prime):
        raise ValueError("prime doit etre un nombre premier")
    if not isinstance(shares, list) or len(shares) < 2:
        raise ValueError("Il faut au moins deux parts")

    normalized = [_normalize_share(share) for share in shares]
    x_values = [x for x, _ in normalized]

    if len(set(x_values)) != len(x_values):
        raise ValueError("Les valeurs x doivent etre distinctes")
    if any(x <= 0 or x >= prime for x in x_values):
        raise ValueError("Chaque x doit etre dans 1...prime-1")

    secret = 0
    lagrange_terms = []

    for i, (x_i, y_i) in enumerate(normalized):
        numerator = 1
        denominator = 1

        for j, (x_j, _) in enumerate(normalized):
            if i == j:
                continue
            numerator = (numerator * (-x_j)) % prime
            denominator = (denominator * (x_i - x_j)) % prime

        denominator_inverse = mod_inverse(denominator, prime)
        coefficient = (numerator * denominator_inverse) % prime
        term = (y_i * coefficient) % prime
        secret = (secret + term) % prime
        lagrange_terms.append({
            "x": x_i,
            "y": y_i,
            "numerator": numerator,
            "denominator": denominator % prime,
            "denominator_inverse": denominator_inverse,
            "lagrange_coefficient": coefficient,
            "term": term,
        })

    return {
        "secret": secret,
        "prime": prime,
        "shares_used": [{"x": x, "y": y} for x, y in normalized],
        "lagrange_terms": lagrange_terms,
    }


def _format_polynomial(coefficients, prime):
    terms = [f"{coefficients[0]}"]

    for degree, coefficient in enumerate(coefficients[1:], start=1):
        if degree == 1:
            terms.append(f"{coefficient}x")
        else:
            terms.append(f"{coefficient}x^{degree}")

    return "f(x) = (" + " + ".join(terms) + f") mod {prime}"
