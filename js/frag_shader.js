var fs = `

#extension GL_OES_standard_derivatives : enable
#define GLSLIFY 1
precision highp float;

uniform vec3 color;
uniform sampler2D texture;
uniform float iGlobalTime;
uniform float animate;

varying vec2 UV;
// varying float vLine;

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289_1540259130(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289_1540259130(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute_1540259130(vec4 x) {
     return mod289_1540259130(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt_1540259130(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise_1540259130(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D_1540259130 = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g_1540259130 = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g_1540259130;
  vec3 i1 = min( g_1540259130.xyz, l.zxy );
  vec3 i2 = max( g_1540259130.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D_1540259130.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289_1540259130(i);
  vec4 p = permute_1540259130( permute_1540259130( permute_1540259130(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D_1540259130.wyz - D_1540259130.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1_1540259130 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0_1540259130 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1_1540259130.xy,h.z);
  vec3 p3 = vec3(a1_1540259130.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt_1540259130(vec4(dot(p0_1540259130,p0_1540259130), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0_1540259130 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0_1540259130,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }

float aastep_1117569599(float threshold, float value) {
  #ifdef GL_OES_standard_derivatives
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
  #else
    return step(threshold, value);
  #endif
}

float hue2rgb_1604150559(float f1, float f2, float hue) {
    if (hue < 0.0)
        hue += 1.0;
    else if (hue > 1.0)
        hue -= 1.0;
    float res;
    if ((6.0 * hue) < 1.0)
        res = f1 + (f2 - f1) * 6.0 * hue;
    else if ((2.0 * hue) < 1.0)
        res = f2;
    else if ((3.0 * hue) < 2.0)
        res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
    else
        res = f1;
    return res;
}

vec3 hsl2rgb_1604150559(vec3 hsl) {
    vec3 rgb;

    if (hsl.y == 0.0) {
        rgb = vec3(hsl.z); // Luminance
    } else {
        float f2;

        if (hsl.z < 0.5)
            f2 = hsl.z * (1.0 + hsl.y);
        else
            f2 = hsl.z + hsl.y - hsl.y * hsl.z;

        float f1 = 2.0 * hsl.z - f2;

        rgb.r = hue2rgb_1604150559(f1, f2, hsl.x + (1.0/3.0));
        rgb.g = hue2rgb_1604150559(f1, f2, hsl.x);
        rgb.b = hue2rgb_1604150559(f1, f2, hsl.x - (1.0/3.0));
    }
    return rgb;
}

vec3 hsl2rgb_1604150559(float h, float s, float l) {
    return hsl2rgb_1604150559(vec3(h, s, l));
}

void main() {
  vec4 texColor = texture2D(texture, UV);
  float sdf = texColor.r;

  float alpha = 0.0;
  float animValue = pow(animate, 2.0);
  float threshold = animValue * 0.5 + 0.5;
  alpha += 0.15 * aastep_1117569599(threshold, sdf + 0.4 * snoise_1540259130(vec3(UV * 10.0, iGlobalTime*0.1)));
  alpha += 0.35 * aastep_1117569599(threshold, sdf + 0.1 * snoise_1540259130(vec3(UV * 50.0, iGlobalTime*0.1)));
  alpha += 0.15 * aastep_1117569599(threshold, sdf);

  float dist = texture2D(texture, UV).r;
  vec3 font_c = vec3(1.0, 1.0 + sin(iGlobalTime*0.1), 1.0);
  vec3 blur_c = vec3(1.0, 1.0, 1.0);
  vec3 halo_c = vec3(1.0, 1.0, 1.0);
  float boundary_o = 0.3;
  float boundary_in = 0.1;

	if ((abs(dist - 0.01) >= boundary_in) && (abs(dist - 0.01) <= boundary_o)) {
	   gl_FragColor = vec4(halo_c * (1.0 - dist * 2.0), 0.0);    // text border
     // gl_FragColor = mix(vec4(0.0, 0.0, 0.0, alpha), texColor, 0.5);
	} else if (abs(dist - 0.01) >= boundary_in) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
		// gl_FragColor = vec4(font_c, 1.0); // text body
	}

}
`;
