import json
import csv
from datetime import datetime

def extract_conversations_to_csv(json_file_path, csv_file_path):
    """
    Extract conversation data from JSON file and save to CSV
    
    Args:
        json_file_path (str): Path to the input JSON file
        csv_file_path (str): Path to the output CSV file
    """
    try:
        # Read the JSON file
        with open(json_file_path, 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
        
        # Extract conversations
        conversations = data.get('conversations', [])
        
        # Define CSV headers
        headers = ['conversationId', 'conversationStart', 'conversationEnd']
        
        # Write to CSV
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=headers)
            
            # Write header row
            writer.writeheader()
            
            # Write data rows
            for conv in conversations:
                row = {
                    'conversationId': conv.get('conversationId', ''),
                    'conversationStart': conv.get('conversationStart', ''),
                    'conversationEnd': conv.get('conversationEnd', '')
                }
                writer.writerow(row)
        
        print(f"Successfully extracted {len(conversations)} conversations to {csv_file_path}")
        
    except FileNotFoundError:
        print(f"Error: Could not find the file {json_file_path}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {json_file_path}")
    except Exception as e:
        print(f"Error: {str(e)}")

def extract_with_formatted_dates(json_file_path, csv_file_path):
    """
    Same as above but with formatted dates (optional alternative)
    """
    try:
        with open(json_file_path, 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
        
        conversations = data.get('conversations', [])
        headers = ['conversationId', 'conversationStart', 'conversationEnd', 
                  'conversationStartFormatted', 'conversationEndFormatted']
        
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=headers)
            writer.writeheader()
            
            for conv in conversations:
                # Parse and format dates
                start_formatted = ""
                end_formatted = ""
                
                if conv.get('conversationStart'):
                    try:
                        start_dt = datetime.fromisoformat(conv['conversationStart'].replace('Z', '+00:00'))
                        start_formatted = start_dt.strftime('%Y-%m-%d %H:%M:%S')
                    except:
                        pass
                
                if conv.get('conversationEnd'):
                    try:
                        end_dt = datetime.fromisoformat(conv['conversationEnd'].replace('Z', '+00:00'))
                        end_formatted = end_dt.strftime('%Y-%m-%d %H:%M:%S')
                    except:
                        pass
                
                row = {
                    'conversationId': conv.get('conversationId', ''),
                    'conversationStart': conv.get('conversationStart', ''),
                    'conversationEnd': conv.get('conversationEnd', ''),
                    'conversationStartFormatted': start_formatted,
                    'conversationEndFormatted': end_formatted
                }
                writer.writerow(row)
        
        print(f"Successfully extracted {len(conversations)} conversations with formatted dates to {csv_file_path}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Usage examples:
    
    # Basic extraction
    extract_conversations_to_csv('payload.json', 'conversations_basic.csv')
    
    # With formatted dates
    extract_with_formatted_dates('payload.json', 'conversations_formatted.csv')
    
    # You can also specify custom file paths:
    # extract_conversations_to_csv('/path/to/your/data.json', '/path/to/output.csv')