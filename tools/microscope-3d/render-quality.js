import * as T from './vendor/three.module.js';
export const effectiveDPR=value=>Math.min(Number(value)>0?Number(value):1,3);
// Native-size multisampled target: geometry AND its ink hull enter the same pass.
export function createQualityPass(renderer){
 const gl=renderer.getContext(),limit=renderer.capabilities.maxSamples||0,requested=4;
 const target=new T.WebGLRenderTarget(1,1,{samples:Math.min(requested,limit),depthBuffer:true,stencilBuffer:false});
 target.texture.minFilter=target.texture.magFilter=T.NearestFilter;target.texture.generateMipmaps=false;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map:target.texture,depthTest:false,depthWrite:false,toneMapped:false}));quad.frustumCulled=false;scene.add(quad);
 const state={requestedSamples:requested,supportedSamples:limit,targetSamples:null,defaultAntialias:!!gl.getContextAttributes()?.antialias,defaultSamples:gl.getParameter(gl.SAMPLES),mode:'pending',error:null};let usable=true;
 function resize(){const size=new T.Vector2(gl.drawingBufferWidth,gl.drawingBufferHeight);target.setSize(size.x,size.y);}
 function render(world,view){if(!usable){renderer.setRenderTarget(null);renderer.render(world,view);return;}try{renderer.setRenderTarget(target);const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER);if(status!==gl.FRAMEBUFFER_COMPLETE)throw Error('multisample framebuffer incomplete');renderer.render(world,view);state.targetSamples=gl.getParameter(gl.SAMPLES);state.mode=state.targetSamples>=4?'MSAA4':'MSAA-limited';renderer.setRenderTarget(null);renderer.render(scene,camera);}catch(error){usable=false;state.targetSamples=null;state.mode='direct-fallback';state.error=String(error.message||error);renderer.setRenderTarget(null);renderer.render(world,view);}}
 return{resize,render,state,target,dispose(){target.dispose();quad.geometry.dispose();quad.material.dispose();}};
}
