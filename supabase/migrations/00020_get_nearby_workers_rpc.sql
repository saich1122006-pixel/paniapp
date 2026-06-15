-- ============================================================================
-- Migration 00020: Create get_nearby_workers RPC function
-- Returns online workers within a radius, with distance_km calculated
-- ============================================================================

CREATE OR REPLACE FUNCTION get_nearby_workers(
    user_lat   FLOAT,
    user_lng   FLOAT,
    radius_km  FLOAT DEFAULT 10
)
RETURNS SETOF JSON AS $$
BEGIN
    RETURN QUERY
    SELECT row_to_json(t) FROM (
        SELECT
            p.id,
            p.full_name,
            p.phone_number,
            p.is_online,
            p.desired_skills,
            p.min_wage_floor,
            p.translations,
            ROUND(
                (extensions.ST_Distance(
                    p.last_location,
                    extensions.ST_MakePoint(user_lng, user_lat)::extensions.geography
                ) / 1000.0)::NUMERIC,
                1
            ) AS distance_km
        FROM public.profiles p
        WHERE p.role = 'worker'
          AND p.is_online = TRUE
          AND p.last_location IS NOT NULL
          AND extensions.ST_DWithin(
                p.last_location,
                extensions.ST_MakePoint(user_lng, user_lat)::extensions.geography,
                radius_km * 1000  -- ST_DWithin uses meters for geography
              )
        ORDER BY p.last_location
            OPERATOR(extensions.<->)
            extensions.ST_MakePoint(user_lng, user_lat)::extensions.geography
    ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_nearby_workers IS
    'Returns online workers within radius_km of (lat,lng), sorted by distance (nearest first), with distance_km included.';
