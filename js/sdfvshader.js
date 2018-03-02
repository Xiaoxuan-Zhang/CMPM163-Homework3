var sdfvshader = `
    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;

    attribute vec3 position;
    attribute vec3 normal;
    precision mediump float;
    void main() {
      gl_Position = projectionMatrix  * viewMatrix * modelMatrix  * vec4( position, 1.0 );
    }
`;
