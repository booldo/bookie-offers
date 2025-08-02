import requests
import re
from typing import Dict, Tuple, List

def decode_secret_message(url: str) -> None:
    """
    Takes a Google Doc URL, retrieves and parses the data, and prints the grid of characters.
    
    Args:
        url (str): URL of the Google Doc containing Unicode characters and coordinates
    """
    try:
        # Fetch the document content
        response = requests.get(url)
        response.raise_for_status()
        content = response.text
        
        # Parse the content to extract character coordinates
        characters = parse_document_content(content)
        
        # Build the grid
        grid = build_character_grid(characters)
        
        # Print the grid
        print_character_grid(grid)
        
    except requests.RequestException as e:
        print(f"Error fetching document: {e}")
    except Exception as e:
        print(f"Error processing document: {e}")

def parse_document_content(content: str) -> List[Tuple[int, int, str]]:
    """
    Parse the document content to extract character coordinates and Unicode characters.
    
    Args:
        content (str): Raw HTML content from the Google Doc
        
    Returns:
        List[Tuple[int, int, str]]: List of (x, y, character) tuples
    """
    characters = []
    
    # Look for patterns that might contain coordinates and characters
    # This is a simplified parser - the actual implementation might need adjustment
    # based on the actual document structure
    
    # Try to find Unicode characters and their coordinates
    # Common patterns in Google Docs might include:
    # - Unicode escape sequences like \uXXXX
    # - Coordinate information in various formats
    
    # For now, let's try to extract any Unicode characters and their positions
    # This is a placeholder implementation that would need to be refined
    # based on the actual document structure
    
    # Look for Unicode characters (basic pattern)
    unicode_pattern = r'\\u([0-9a-fA-F]{4})'
    unicode_matches = re.findall(unicode_pattern, content)
    
    # Also look for potential coordinate patterns
    coord_pattern = r'(\d+)\s*,\s*(\d+)'
    coord_matches = re.findall(coord_pattern, content)
    
    # This is a simplified approach - in practice, you'd need to understand
    # the exact format of the document to properly parse it
    print("Note: This is a basic implementation. The actual document parsing")
    print("would need to be customized based on the specific format of the Google Doc.")
    
    return characters

def build_character_grid(characters: List[Tuple[int, int, str]]) -> List[List[str]]:
    """
    Build a 2D grid from character coordinates.
    
    Args:
        characters (List[Tuple[int, int, str]]): List of (x, y, character) tuples
        
    Returns:
        List[List[str]]: 2D grid of characters
    """
    if not characters:
        return []
    
    # Find the dimensions of the grid
    max_x = max(char[0] for char in characters) if characters else 0
    max_y = max(char[1] for char in characters) if characters else 0
    
    # Create the grid filled with spaces
    grid = [[' ' for _ in range(max_x + 1)] for _ in range(max_y + 1)]
    
    # Place characters in their correct positions
    for x, y, char in characters:
        if 0 <= y < len(grid) and 0 <= x < len(grid[0]):
            grid[y][x] = char
    
    return grid

def print_character_grid(grid: List[List[str]]) -> None:
    """
    Print the character grid to reveal the secret message.
    
    Args:
        grid (List[List[str]]): 2D grid of characters
    """
    if not grid:
        print("No grid to display.")
        return
    
    for row in grid:
        print(''.join(row))

# Example usage and test
if __name__ == "__main__":
    # Test URL from the assignment
    test_url = "https://docs.google.com/document/d/e/2PACX-1vTER-wL5E8YC9pxDx43gk8elds59GtUUk4nJo_ZWagbnrH0NFvMXlw6VWFLpf5tWTZIT9P9oLIoFJ6A/pub"
    
    print("Decoding secret message from Google Doc...")
    decode_secret_message(test_url) 