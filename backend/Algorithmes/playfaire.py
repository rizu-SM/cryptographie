def generate_matrix(key):
    key = key.upper().replace("J", "I")
    seen = set()
    matrix = []

    # ajouter clé
    for char in key:
        if char.isalpha() and char not in seen:
            seen.add(char)
            matrix.append(char)

    # compléter avec alphabet
    for char in "ABCDEFGHIKLMNOPQRSTUVWXYZ":  # pas de J
        if char not in seen:
            matrix.append(char)

    # convertir en matrice 5x5
    return [matrix[i:i+5] for i in range(0, 25, 5)]


def find_position(matrix, char):
    for i in range(5):
        for j in range(5):
            if matrix[i][j] == char:
                return i, j


def prepare_text(text):
    text = text.upper().replace("J", "I")
    text = "".join([c for c in text if c.isalpha()])

    prepared = ""
    i = 0

    while i < len(text):
        a = text[i]
        b = text[i+1] if i+1 < len(text) else "X"

        if a == b:
            prepared += a + "X"
            i += 1
        else:
            prepared += a + b
            i += 2

    if len(prepared) % 2 != 0:
        prepared += "X"

    return prepared


def playfair_encrypt(text, key):
    matrix = generate_matrix(key)
    text = prepare_text(text)

    result = ""

    for i in range(0, len(text), 2):
        a, b = text[i], text[i+1]

        row1, col1 = find_position(matrix, a)
        row2, col2 = find_position(matrix, b)

        # même ligne
        if row1 == row2:
            result += matrix[row1][(col1 + 1) % 5]
            result += matrix[row2][(col2 + 1) % 5]

        # même colonne
        elif col1 == col2:
            result += matrix[(row1 + 1) % 5][col1]
            result += matrix[(row2 + 1) % 5][col2]

        # rectangle
        else:
            result += matrix[row1][col2]
            result += matrix[row2][col1]

    return result.lower()


def playfair_decrypt(ciphertext, key):
    matrix = generate_matrix(key)
    text = ciphertext.upper()

    result = ""

    for i in range(0, len(text), 2):
        a, b = text[i], text[i+1]

        row1, col1 = find_position(matrix, a)
        row2, col2 = find_position(matrix, b)

        # même ligne
        if row1 == row2:
            result += matrix[row1][(col1 - 1) % 5]
            result += matrix[row2][(col2 - 1) % 5]

        # même colonne
        elif col1 == col2:
            result += matrix[(row1 - 1) % 5][col1]
            result += matrix[(row2 - 1) % 5][col2]

        # rectangle
        else:
            result += matrix[row1][col2]
            result += matrix[row2][col1]

    return result.lower()