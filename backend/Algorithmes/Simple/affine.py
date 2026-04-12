from math import gcd

VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]

def mod_inverse(a: int, m: int) -> int:
    for i in range(1, m):
        if (a * i) % m == 1:
            return i
    raise ValueError(f"No modular inverse for a={a}")

def affine_encrypt(plaintext: str, a: int, b: int) -> str:
    if a not in VALID_A:
        raise ValueError(f"'a' must be coprime with 26. Valid values: {VALID_A}")
    
    result = ""
    for char in plaintext:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            x = ord(char) - base
            result += chr((a * x + b) % 26 + base)
        else:
            result += char
    return result

def affine_decrypt(ciphertext: str, a: int, b: int) -> str:
    if a not in VALID_A:
        raise ValueError(f"'a' must be coprime with 26. Valid values: {VALID_A}")
    
    a_inv = mod_inverse(a, 26)
    result = ""
    for char in ciphertext:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            y = ord(char) - base
            result += chr((a_inv * (y - b)) % 26 + base)
        else:
            result += char
    return result