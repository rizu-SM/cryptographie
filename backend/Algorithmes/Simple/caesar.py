# algorithms/caesar.py

def caesar_encrypt(plaintext: str, key: int) -> str:
    result = ""
    for char in plaintext:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + key) % 26 + base)
        else:
            result += char
    return result


def caesar_decrypt(ciphertext: str, key: int) -> str:
    return caesar_encrypt(ciphertext, -key)