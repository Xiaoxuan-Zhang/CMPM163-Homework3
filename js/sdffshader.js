var sdffshader = `
    precision mediump float;

    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_val;
    
    vec2 doModel(vec3 p);

    vec2 squareFrame(vec2 screenSize, vec2 coord) {
      vec2 position = 2.0 * (coord.xy / screenSize.xy) - 1.0;
      position.x *= screenSize.x / screenSize.y;
      return position;
    }

    vec2 calcRayIntersection(vec3 rayOrigin, vec3 rayDir, float maxd, float precis) {
      float latest = precis * 2.0;
      float dist   = +0.0;
      float type   = -1.0;
      vec2  res    = vec2(-1.0, -1.0);

      for (int i = 0; i < 90; i++) {
        if (latest < precis || dist > maxd) break;

        vec2 result = doModel(rayOrigin + rayDir * dist);

        latest = result.x;
        type   = result.y;
        dist  += latest;
      }

      if (dist < maxd) {
        res = vec2(dist, type);
      }

      return res;
    }

    vec2 calcRayIntersection(vec3 rayOrigin, vec3 rayDir) {
      return calcRayIntersection(rayOrigin, rayDir, 20.0, 0.001);
    }

    vec3 calcNormal(vec3 pos, float eps) {
      const vec3 v1 = vec3( 1.0,-1.0,-1.0);
      const vec3 v2 = vec3(-1.0,-1.0, 1.0);
      const vec3 v3 = vec3(-1.0, 1.0,-1.0);
      const vec3 v4 = vec3( 1.0, 1.0, 1.0);

      return normalize( v1 * doModel( pos + v1*eps ).x +
                        v2 * doModel( pos + v2*eps ).x +
                        v3 * doModel( pos + v3*eps ).x +
                        v4 * doModel( pos + v4*eps ).x );
    }

    vec3 calcNormal(vec3 pos) {
      return calcNormal(pos, 0.002);
    }

    mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
      vec3 rr = vec3(sin(roll), cos(roll), 0.0);
      vec3 ww = normalize(target - origin);
      vec3 uu = normalize(cross(ww, rr));
      vec3 vv = normalize(cross(uu, ww));

      return mat3(uu, vv, ww);
    }

    vec3 getRay(mat3 camMat, vec2 screenPos, float lensLength) {
      return normalize(camMat * vec3(screenPos, lensLength));
    }

    vec3 getRay(vec3 origin, vec3 target, vec2 screenPos, float lensLength) {
      mat3 camMat = calcLookAtMatrix(origin, target, 0.0);
      return getRay(camMat, screenPos, lensLength);
    }

    void orbitCamera(
      in float camAngle,
      in float camHeight,
      in float camDistance,
      in vec2 screenResolution,
      out vec3 rayOrigin,
      out vec3 rayDirection,
      in vec2 coord
    ) {
      vec2 screenPos = squareFrame(screenResolution, coord);
      vec3 rayTarget = vec3(0.0);

      rayOrigin = vec3(
        camDistance * sin(camAngle),
        camHeight,
        camDistance * cos(camAngle)
      );

      rayDirection = getRay(rayOrigin, rayTarget, screenPos, 2.0);
    }

    highp float random(vec2 co)
    {
        highp float a = 12.9898;
        highp float b = 78.233;
        highp float c = 43758.5453;
        highp float dt= dot(co.xy ,vec2(a,b));
        highp float sn= mod(dt,3.14);
        return fract(sin(sn) * c);
    }

    float gaussianSpecular(
      vec3 lightDirection,
      vec3 viewDirection,
      vec3 surfaceNormal,
      float shininess) {
      vec3 H = normalize(lightDirection + viewDirection);
      float theta = acos(dot(H, surfaceNormal));
      float w = theta / shininess;
      return exp(-w*w);
    }

    // Originally sourced from:
    // http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

    float sdBox(vec3 position, vec3 dimensions) {
      vec3 d = abs(position) - dimensions;

      return min(max(d.x, max(d.y,d.y)), 0.0) + length(max(d, 0.0));
    }

    float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }

    float fogFactorExp2(
      const float dist,
      const float density
    ) {
      const float LOG2 = -1.442695;
      float d = density * dist;
      return 1.0 - clamp(exp2(d * d * LOG2), 0.0, 1.0);
    }

    vec2 rotate2D(vec2 p, float a) {
      return p * mat2(cos(a), -sin(a), sin(a),  cos(a));
    }

    float doBox(vec3 p) {
      p += vec3(0, 1, 0) * sin(u_val * 3.);
      p.xz = rotate2D(p.xz, (u_val * 5. + sin(0.8 + u_val * 3.)) * 0.7);
      p.xy = rotate2D(p.xy, (u_val * 5. + sin(0.8 + u_val * 3.)) * 0.5);

      return sdBox(p, vec3(0.3) - 0.05) - 0.05;
    }

    float doBoard(vec3 p) {
      const float boardRound = 0.125;

      float d;

      d = p.y - max(-1.0, 2.5 - length(p.xz)) * (sin(length(p.xz) * 12. - u_val * 10. + sin(u_val * 3.) * 2.) * 0.5 + 0.5) * 0.1 + 1.0;
      d = -smin(-d, -sdBox(p, vec3(2, 2.25, 2) - boardRound) + boardRound * 2., 0.06);
      d = -smin(-d, length(p + vec3(0, 1, 0) * sin(u_val * 3.)) - 0.5, 1.25);

      return d;
    }

    vec2 doModel(vec3 p) {
      p.xz = rotate2D(p.xz, u_mouse.y <= 0.0 ? 0.4 : 5. * u_mouse.x / u_resolution.x);
      p.y -= 1.25;

      float d = 99999.0;
      float id = 0.0;

      d = min(doBoard(p), doBox(p));

      return vec2(d, id);
    }

    vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
      return a + b*cos( 6.28318*(c*t+d) );
    }

    float intersectPlane(vec3 ro, vec3 rd, vec3 nor, float dist) {
      float denom = dot(rd, nor);
      float t = -(dot(ro, nor) + dist) / denom;

      return t;
    }

    vec3 bg(vec3 ro, vec3 rd) {
      float t = rd.y * 0.4 + 0.4;
      vec3 grad = vec3(0.1, 0.05, 0.15) + palette(t
        , vec3(0.55, 0.5, 0.5)
        , vec3(0.6, 0.6, 0.5)
        , vec3(0.9, 0.6, 0.45)
        , vec3(0.03, 0.15, 0.25)
      );

      float d = intersectPlane(ro, rd, vec3(0, 1, 0), 8.);
      if (d > 0.0) {
        vec3 p = ro + rd * d;
        float g = (1.0 - pow(abs(sin(p.x * 1.25) * cos(p.y * 1.25)), 0.06125));

        grad += (1.0 - fogFactorExp2(d, 0.04)) * vec3(0.5, 2.5, 1.9) * g * 0.18;
      }

      return grad;
    }

    void main() {
      vec3 ro, rd;
      vec2 uv = squareFrame(u_resolution.xy, gl_FragCoord.xy);

      float rotation = 0.9;
      float height   = u_mouse.y <= 0.0 ? 5.0 : (1.0 - u_mouse.y / u_resolution.y * 2.0) * 10.;
      float dist     = 6.0;
      orbitCamera(rotation, height, dist, u_resolution.xy, ro, rd, gl_FragCoord.xy);

      vec3 color = bg(ro, rd);

      vec2 t = calcRayIntersection(ro, rd, 20., 0.001);
      if (t.x > -0.5) {
        vec3 pos = ro + rd * t.x;
        vec3 nor = calcNormal(pos);

        vec3 ldir1 = normalize(vec3(-0.25, 1, -1));
        vec3 ldir2 = normalize(vec3(0, -0.8, 1));

        color = bg(pos, reflect(rd, nor)) + 0.05;
        //color += 2.* gaussianSpecular(ldir1, -rd, nor, 0.085);
        //color += 0.55* gaussianSpecular(ldir2, -rd, nor, 0.15);

      } else {
        color = bg(ro, rd);
      }

      color.g = smoothstep(-0.09, 1.1, color.g);
      color.r = smoothstep(0.0, 1.02, color.r);
      color.b += 0.015;
      color -= (dot(uv * 0.05, uv)) * vec3(0.5, 0.3, 0.6);
      color += (uv.y * 0.5 + 0.5) * vec3(0.005, -0.05, 0.105) * 0.6;
      color += random(gl_FragCoord.xy * 0.001 + sin(u_val)) * 0.04;

      gl_FragColor.rgb = color;
      gl_FragColor.a   = 1.0;

    }
`;
