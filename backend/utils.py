import math

def check_proximity(user_lat, user_lng, comp_lat, comp_lng, radius):
    R = 6371000  # Yer radiusi metrda
    
    phi1, phi2 = math.radians(user_lat), math.radians(comp_lat)
    dphi = math.radians(comp_lat - user_lat)
    dlambda = math.radians(comp_lng - user_lng)

    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c

    return distance <= radius, distance