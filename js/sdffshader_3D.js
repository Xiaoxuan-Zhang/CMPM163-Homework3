var sdffshader = `
precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_val;
uniform sampler2D texture;

/**
 * Part 2 Challenges
 * - Change the diffuse color of the sphere to be blue
 * - Change the specual color of the sphere to be green
 * - Make one of the lights pulse by having its intensity vary over time
 * - Add a third light to the scene
 */

const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;

/**
 * Signed distance function for a sphere centered at the origin with radius 1.0;
 */
float sphereSDF(vec3 samplePoint) {
    return length(samplePoint) - 1.0;
}

float sphereSDF(vec3 samplePoint, float r) {
    return length(samplePoint) - r;
}

float sphereSDF(vec3 samplePoint, vec3 posSphere, float r) {
    return length(samplePoint - posSphere) - r;
}

float udRoundBox( vec3 p, vec3 size, float r )
{
  return length(max(abs(p) - size, 0.0)) - r;
}

float udRoundBox( vec3 p, vec3 size, vec3 pos, float r )
{
  return length(max(abs(p - pos) - size, 0.0)) - r;
}

float displacement(vec3 samplePoint) {
    return 0.2* sin(20.0*samplePoint.x)*sin(20.0*samplePoint.y)*sin(20.0*samplePoint.z);
}

float opDisplace( vec3 p )
{
    float d1 = sphereSDF(p);
    float d2 = displacement(p);
    return d1+d2;
}
float sdTorus( vec3 p, vec2 t )
{
    return length( vec2(length(p.xz)-t.x, p.y) )-t.y;
}

float unionSDF(float distA, float distB) {
    return min(distA, distB);
}

/**
 * Constructive solid geometry intersection operation on SDF-calculated distances.
 */
float intersectSDF(float distA, float distB) {
    return max(distA, distB);
}


/**
 * Constructive solid geometry difference operation on SDF-calculated distances.
 */
float differenceSDF(float distA, float distB) {
    return max(distA, -distB);
}


/**
 * Constructive solid geometry difference operation on SDF-calculated distances.
 */
float weirdSDF(float distA, float distB) {
    return mix(distA, distB, sin(u_val) + 1.0);
}

// polynomial smooth min (k = 0.1);
float sdfBlend( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

/**
 * Signed distance function describing the scene.
 *
 * Absolute value of the return value indicates the distance to the surface.
 * Sign indicates whether the point is inside or outside the surface,
 * negative indicating inside.
 */
float sceneSDF(vec3 samplePoint) {

  vec3 pbox = vec3(samplePoint.x + 1.0, samplePoint.y - 0.1, samplePoint.z);
  float box = udRoundBox( pbox,
                          vec3(1.2, 0.2, 0.5) *0.2,
                         vec3(sin(u_val*1.8 + 0.2) * 0.3, cos(u_val + 0.2) * 0.45, 0.0),
                         0.2);
 float d1 = box;
 float d2 = displacement(pbox);
 float dbox = d1+d2;

  vec3 tp = vec3(samplePoint.x - 1.0, samplePoint.y+1.0, samplePoint.z);
  float torus = sdTorus(tp, vec2(0.5,0.1));

  tp = vec3(samplePoint.x - 0.5,samplePoint.y+1.0,samplePoint.z);
  float sphere0 = sphereSDF(tp, 0.4);

  float sphere = sphereSDF(vec3(samplePoint.x - 1.0, samplePoint.yz),
                           vec3(sin(u_val + 0.7) * 0.6, cos(u_val*2.2 + 0.17) * 0.2, 0.0),
                           0.5 + 0.2 * sin(u_val));


  float box2 = udRoundBox( samplePoint,vec3(0.4, 0.1, 0.0), 0.3);

  float sphere2 = sphereSDF(vec3(samplePoint.x - 1.0, samplePoint.yz));

  float morhp = mix(box2, sphere2, 0.5+ 0.5*cos(10.0*u_val));

  //    float blend1 = sdfBlend(box, sphere, 0.2);
  //    float blend2 = sdfBlend(blend1, sphere2, 0.2);
  //    float blend1 = unionSDF(box, sphere );
  //    float blend2 = unionSDF(blend1, sphere2 );
  //    float blend1 = intersectSDF(box, sphere );
  //    float blend2 = intersectSDF(blend1, sphere2 );
  //    float blend1 = differenceSDF(box, sphere );
  //    float blend2 = differenceSDF(blend1, sphere2 );
  float blend0 = differenceSDF(torus,sphere0);
  float blend1 = unionSDF(blend0, dbox);
  float blend2 = sdfBlend(morhp, blend1, 0.2 );


  return( blend2 );


}

vec4 getTextureSampledColor(vec3 eye, float dist, vec3 marchingDirection) {
  vec3 samplePoint = eye + dist * marchingDirection;
  vec3 tp = vec3(samplePoint.x - 1.0, samplePoint.y+1.0, samplePoint.z);
  float torus = sdTorus(tp, vec2(0.5,0.1));

  tp = vec3(samplePoint.x - 0.5,samplePoint.y+1.0,samplePoint.z);
  float sphere0 = sphereSDF(tp, 0.4);
  float blend0 = differenceSDF(torus,sphere0);

  vec3 uvPoint = tp;
  float threshold = 0.1;
  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);
  if (blend0 <= threshold) {
    color -= vec4(texture2D(texture, uvPoint.xy).rgb, 0.3);
  }
  return color;
}


/**
 * Return the shortest distance from the eyepoint to the scene surface along
 * the marching direction. If no part of the surface is found between start and end,
 * return end.
 *
 * eye: the eye point, acting as the origin of the ray
 * marchingDirection: the normalized direction to march in
 * start: the starting distance away from the eye
 * end: the max distance away from the ey to march before giving up
 */
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) {
            return depth;
        }
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}


/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 *
 * fieldOfView: vertical field of view in degrees
 * size: resolution of the output image
 * fragCoord: the x,y coordinate of the pixel in the output image
 */
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}

/**
 * Using the gradient of the SDF, estimate the normal on the surface at point p.
 */
vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

/**
 * Lighting contribution of a single point light source via Phong illumination.
 *
 * The vec3 returned is the RGB color of the light's contribution.
 *
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 * lightPos: the position of the light
 * lightIntensity: color/intensity of the light
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));

    float dotLN = dot(L, N);
    float dotRV = dot(R, V);

    if (dotLN < 0.0) {
        // Light not visible from this point on the surface
        return vec3(0.0, 0.0, 0.0);
    }

    if (dotRV < 0.0) {
        // Light reflection in opposite direction as viewer, apply only diffuse
        // component
        return lightIntensity * (k_d * dotLN);
    }
//    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

/**
 * Lighting via Phong illumination.
 *
 * The vec3 returned is the RGB color of that point after lighting is applied.
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
//    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
//    vec3 color = ambientLight * k_a;

    vec3 color = k_a;

    vec3 light1Pos = vec3(4.0 * sin(u_val),
                          2.0,
                          4.0 * cos(u_val));
//    vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
    vec3 light1Intensity = vec3(0.5, 0.5, 0.5);

    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light1Pos,
                                  light1Intensity);

    vec3 light2Pos = vec3(2.0 * sin(0.37 * u_val),
                          2.0 * cos(0.37 * u_val),
                          2.0);
//    vec3 light2Intensity = vec3(0.4, 0.4, 0.4);
    vec3 light2Intensity = vec3(0.5, 0.5, 0.5);

    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);
    return color;
}

mat3 viewMatrix(vec3 eye, vec3 center, vec3 up) {
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat3(s, u, -f);
}

void main( void)
{
    vec3 viewDir = rayDirection(60.0, u_resolution.xy, gl_FragCoord.xy);
    vec3 eye = vec3(0.0, 1.0, 5.0);

    mat3 viewToWorld = viewMatrix(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));

    vec3 worldDir = viewToWorld * viewDir;

    float dist = shortestDistanceToSurface(eye, worldDir, MIN_DIST, MAX_DIST);

    if (dist > MAX_DIST - EPSILON) {
        // Didn't hit anything
        gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
		    return;
    }
    //Basic color
    vec2 fragPos = gl_FragCoord.xy;
    float t = u_val / 2.;
    fragPos = 2.* fragPos / u_resolution.xy - 1.;
    //vec3 U = vec3(fragPos, fragPos.x * fragPos.y );
    vec3 U = vec3((0.4+ 0.2 * abs(sin(10.0*u_val + fragPos.x))),0.3+0.1 * abs(cos(5.0*u_val+fragPos.y)), (0.3+0.3 * abs(sin(20.0*u_val + fragPos.x)))); //Simplified

    // The closest point on the surface to the eyepoint along the view ray
    vec3 p = eye + dist * worldDir;

    vec3 K_a = vec3(0.25, 0.25, 0.15);		// Material Ambient color
    vec3 K_d = vec3(1.0, 0.9, 0.8);		// Material Diffuse color
    vec3 K_s = vec3(1.0, 1.0, 1.0);		// Material Specular color (components > 1 are ok!)
    float shininess = 25.0;

    vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);

	  color *= U;;

    gl_FragColor = vec4(color, 1.0);

    vec4 texColor = getTextureSampledColor(eye, dist, worldDir);

    gl_FragColor *= texColor;
}

`;
