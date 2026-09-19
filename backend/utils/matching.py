from bson import ObjectId
from config import db, GROQ_API_KEY
from utils.notifications import create_notification
from groq import AsyncGroq
import datetime

groq_client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

async def calculate_match_score(lost_item: dict, found_item: dict) -> int:
    if not groq_client:
        return calculate_match_score_fallback(lost_item, found_item)
    
    prompt = f"""
    You are an AI matching lost and found items.
    Compare these two items and return ONLY a confidence score from 0 to 100 representing how likely they are the exact same item.
    Do not return any text, just the integer number.
    
    Lost Item:
    Title: {lost_item.get('title')}
    Description: {lost_item.get('description')}
    Category: {lost_item.get('category')}
    Location: {lost_item.get('location')}
    
    Found Item:
    Title: {found_item.get('title')}
    Description: {found_item.get('description')}
    Category: {found_item.get('category')}
    Location: {found_item.get('location')}
    """
    try:
        models = await groq_client.models.list()
        valid_models = [m.id for m in models.data if "whisper" not in m.id and "prompt-guard" not in m.id]
        model_name = valid_models[0] if valid_models else "llama3-8b-8192"
        
        response = await groq_client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=5
        )
        content = response.choices[0].message.content.strip()
        # Extract integer from response
        import re
        match = re.search(r'\d+', content)
        if match:
            return int(match.group())
        return 0
    except Exception as e:
        print(f"Groq API Error: {e}")
        return calculate_match_score_fallback(lost_item, found_item)

def calculate_match_score_fallback(lost_item: dict, found_item: dict) -> int:
    score = 0
    if lost_item.get('category') == found_item.get('category'):
        score += 40
    import re
    lost_loc = set(re.findall(r'\w+', lost_item.get('location', '').lower()))
    found_loc = set(re.findall(r'\w+', found_item.get('location', '').lower()))
    common_loc = lost_loc.intersection(found_loc)
    score += min(30, len(common_loc) * 10)
    
    lost_desc = set(re.findall(r'\w+', lost_item.get('description', '').lower()))
    found_desc = set(re.findall(r'\w+', found_item.get('description', '').lower()))
    common_desc = lost_desc.intersection(found_desc)
    score += min(30, len(common_desc) * 10)
    
    return score

async def run_auto_matching(new_item: dict):
    try:
        opposite_type = 'found' if new_item.get('type') == 'lost' else 'lost'
        
        cursor = db.items.find({
            "type": opposite_type,
            "status": "active",
            "category": new_item.get('category')
        })
        candidates = await cursor.to_list(length=100)
        
        MATCH_THRESHOLD = 40
        
        for candidate in candidates:
            lost_item = new_item if new_item.get('type') == 'lost' else candidate
            found_item = new_item if new_item.get('type') == 'found' else candidate
            
            existing = await db.matches.find_one({
                "lostItem": lost_item["_id"],
                "foundItem": found_item["_id"]
            })
            if existing: continue
            
            score = await calculate_match_score(lost_item, found_item)
            
            if score >= MATCH_THRESHOLD:
                lost_user_id = lost_item.get('reportedBy')
                if isinstance(lost_user_id, dict): lost_user_id = lost_user_id.get('_id')
                found_user_id = found_item.get('reportedBy')
                if isinstance(found_user_id, dict): found_user_id = found_user_id.get('_id')

                match = {
                    "lostItem": lost_item["_id"],
                    "foundItem": found_item["_id"],
                    "lostUser": lost_user_id,
                    "foundUser": found_user_id,
                    "matchScore": score,
                    "status": "MATCHED",
                    "createdAt": datetime.datetime.utcnow(),
                    "updatedAt": datetime.datetime.utcnow()
                }
                res = await db.matches.insert_one(match)
                
                await create_notification(
                    user_id=lost_user_id,
                    title='🎯 Match Found!',
                    message=f'A found item "{found_item.get("title")}" may match your lost "{lost_item.get("title")}". Check your matches!',
                    type_='match_found',
                    link='/matches',
                    related_match=res.inserted_id
                )
                
                await create_notification(
                    user_id=found_user_id,
                    title='🎯 Match Found!',
                    message=f'Your found item "{found_item.get("title")}" may match someone\'s lost "{lost_item.get("title")}".',
                    type_='match_found',
                    link='/matches',
                    related_match=res.inserted_id
                )
    except Exception as e:
        print(f"Auto-matching error: {e}")
