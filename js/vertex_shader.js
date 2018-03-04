var vs = `
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

//Since we are using BufferGeometry, we have defined the attributes that we need manually
attribute vec3 position;
attribute vec2 texCoords;

//link variables between the vertex shader and the fragment shader
varying vec2 UV;

void main() {
    //pass our interpolated texCoords to the fragment shader
    UV = texCoords;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
