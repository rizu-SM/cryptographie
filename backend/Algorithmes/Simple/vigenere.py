def vigenere_encrypt(plaintext: str, key: str) -> str:
    result = ""
    key = key.lower()
    key_index = 0

    for char in plaintext:
        if char.isalpha():
            base = ord('a') if char.islower() else ord('A')

            shift = ord(key[key_index % len(key)]) - ord('a')

            encrypted_char = chr((ord(char) - base + shift) % 26 + base)
            result += encrypted_char

            key_index += 1
        else:
            result += char

    return result


def vigenere_decrypt(ciphertext: str, key: str) -> str:
    result = ""
    key = key.lower()
    key_index = 0

    for char in ciphertext:
        if char.isalpha():
            base = ord('a') if char.islower() else ord('A')

            shift = ord(key[key_index % len(key)]) - ord('a')

            decrypted_char = chr((ord(char) - base - shift) % 26 + base)
            result += decrypted_char

            key_index += 1
        else:
            result += char

    return result