const game = ( function () {

    // cretion of all the variable needed in the project
    let scene, camera, renderer, dirLight, hemiLight, ground, line, controls, raycaster, targetRay;
    let greenFront, blueFront, yellowFront, greyFront;
    let theta, phi, max;

    let SCORE = 0;
    let COMBO = 0;
    let MAX_COMBO = 0;

    let loadingManager;
    let RESOURCES_LOADED = false;

    const grey = 0x4b4b4b;      // RGB : {r: 0.29411764705882354, g: 0.29411764705882354, b: 0.29411764705882354}
    const green = 0x00aa00;     // RGB : {r: 0, g: 0.6666666666666666, b: 0}
    const blue = 0x0000aa;      // RGB : {r: 0, g: 0, b: 0.6666666666666666}
    const yellow = 0xFFCC00;    // RGB : {r: 1, g: 0.8, b: 0}

    const  mouse = new THREE.Vector2( );
    let pos = new THREE.Vector3( );

    // standard position of the camera
    const origin = new THREE.Vector3( 0, 8, 0 );

    // vector along the axis Z
    const z = new THREE.Vector3( 0, 0,  1 );

    let intersect = [ ];

    // array for the object we hold 
    let objectInHand = [ ];

    // contains all the objects in the scene
    let objectsInScene = [ ];

    // array for the objects throwed and which are still up air
    let objectsUpAir = [ ];

    // ms before the next throw available
    const reload = 200;
    let time = - reload;
    let timeInPause = 0, timeRestart = 0, timePaused = 0;

    // list of models with their directory and mesh corresponding
    let model = {
        bins: {
            obj: 'bins.obj',
            mtl: 'bins.mtl',
            mesh: null
        },
        apple: {
            obj: 'apple.obj',
            mtl: 'apple.mtl',
            img: 'img/apple.png',
            color: 'green',
            bin: green,
            mesh: null
        },
        can: {
            obj: 'can.obj',
            mtl: 'can.mtl',
            img: 'img/can.png',
            color: 'yellow',
            bin: yellow,
            mesh: null
        },
        glassBottle: {
            obj: 'glassBottle.obj',
            mtl: 'glassBottle.mtl',
            img: 'img/glassBottle.png',
            color: 'blue',
            bin: blue,
            mesh: null
        },
        mug: {
            obj: 'mug.obj',
            mtl: 'mug.mtl',
            img: 'img/mug.png',
            color: 'grey',
            bin: grey,
            mesh: null
        },
        pillow: {
            obj: 'pillow.obj',
            mtl: 'pillow.mtl',
            img: 'img/pillow.png',
            color: 'grey',
            bin: grey,
            mesh: null
        },
        clementine: {
            obj: 'clementine.obj',
            mtl: 'clementine.mtl',
            img: 'img/clementine.png',
            color: 'green',
            bin: green,
            mesh: null
        },
        cardbox: {
            obj: 'cardbox.obj',
            mtl: 'cardbox.mtl',
            img: 'img/cardbox.png',
            color: 'yellow',
            bin: yellow,
            mesh: null
        }
    };

    // meshes created along loading models and added to the scene
    let meshes = { };
    
    // function returning dot product for 3d vectors
    const dotProd = ( vecA, vecB ) => ( ( vecA.x * vecB.x ) + ( vecA.y * vecB.y ) + ( vecA.z * vecB.z ) ) ;
    
    // function returning product of 3d vectors magnitude
    const vecMagnProd = ( vecA, vecB ) => ( Math.sqrt( Math.pow( vecA.x, 2 ) + Math.pow( vecA.y, 2 ) + Math.pow( vecA.z, 2 ) ) * Math.sqrt( Math.pow( vecB.x, 2 ) + Math.pow( vecB.y, 2 ) + Math.pow( vecB.z, 2 ) ) )
    
    // function returning the angle between two vectors
    const getAngle = ( vecA, vecB ) => Math.acos( dotProd( vecA, vecB ) / vecMagnProd( vecA, vecB ) );

    // function returning the max distance to travel
    const getMaxDist = function( angle ) {

        if ( angle > 0.785398 ) {
            if ( angle > 2.356109 )
                return 7.02767 * Math.sin( angle ); // > 135°
            else if ( angle > 1.5708 )
                return -19.65884381 + 34.65884381 * Math.sin( angle ); // 90° <  < 135°
            else 
                return 66.21318323 + ( -51.21318323 ) * Math.sin( angle ); // 45° <  < 90°
        }
        else 
            return 42.4264138 * Math.sin( angle ); // < 45°

    }
    
    // create our scene where the objects are added
    const initScene = function( ) {
        
        scene = new THREE.Scene;
        scene.background = new THREE.Color( ).setHSL( 0.6, 0, 1 );
        scene.fog = new THREE.Fog( scene.background, 1, 5000 );

    }
    
    // create the camera and set it up
    const initCamera = function( ) {

        camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 5000 );
        camera.position.copy( origin ); 
        mouse.x = 0, mouse.y = 0;
        
        // camera movement 
        controls = new THREE.PointerLockControls( camera, document.body );

        raycaster = new THREE.Raycaster( new THREE.Vector3( ), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
        targetRay = new THREE.Raycaster( new THREE.Vector3( ), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

        // unlock the camera when press SPACEBAR
        window.addEventListener( 'keypress', ( e ) => {

            if( e.keyCode == 32 )
                controls.lock();

        }, false );

        controls.addEventListener( 'lock', ( ) => {

            timeRestart = performance.now( );
            timeInPause += timeRestart - timePaused;

            document.getElementById( 'info' ).style.display = 'none';
            document.getElementById( 'block' ).style.display = 'none';

        } );
        controls.addEventListener( 'unlock', ( ) => {

            timePaused = performance.now( );

            if ( performance.now( ) - timeInPause >= 19989 ) {

                document.getElementById( 'info' ).innerHTML = "Time's up! <br /><br />Score : " + SCORE + "<br />Combo max : " + MAX_COMBO;
                const button = document.createElement( "button" );
                button.innerHTML = "Retry";
                document.getElementById( 'info' ).appendChild( button );

                button.addEventListener( 'click', ( ) => {
                    location.reload( );
                } );

            }
            else {
                document.getElementById( 'info' ).innerHTML = "<span style=\"font-size: 50px\">Game paused</span><span style=\"font-size: 30px\">Press SPACE to play</span>"
            }
            document.getElementById( 'info' ).style.display = 'flex';
            document.getElementById( 'info' ).style.justifyContent = 'center';
            document.getElementById( 'info' ).style.flexDirection = 'column';
            document.getElementById( 'block' ).style.display = '';

        })
        scene.add( controls.getObject( ) );

    }

    // create the render
    const initRender = function( ) {

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;

        document.body.appendChild( renderer.domElement );

    }

    // create the light, add the shadows and the sky
    const initLights = function( ) {

        hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        dirLight.color.setHSL( 0.1, 1, 0.95 );
        dirLight.position.set( - 1, 1.75, 1 );
        dirLight.position.multiplyScalar( 30 );
        scene.add( dirLight );

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        const d = 30;

        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 200;

        // create a sky dome 
        const vertexShader = document.getElementById( 'vertexShader' ).textContent;
        const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
        const uniforms = {
            "topColor": { value: new THREE.Color( 0x0077ff ) },
            "bottomColor": { value: new THREE.Color( 0xffffff ) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms[ "topColor" ].value.copy( hemiLight.color );

        scene.fog.color.copy( uniforms[ "bottomColor" ].value );

        const skyGeo = new THREE.SphereBufferGeometry( 4000, 32, 15 );
        const skyMat = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        } );

        const sky = new THREE.Mesh( skyGeo, skyMat );
        scene.add( sky );

    }

    // create all the predefined objects
    const initObjects = function( ) {

        // add a ground
        const groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
        const groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
        groundMat.color.setHSL( 0.095, 1, 0.75 );
        ground = new THREE.Mesh( groundGeo, groundMat );
        ground.name = "ground";
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        scene.add( ground );
        objectsInScene.push( ground );
        
        // add one object in the hand
        addObjectInHand( );

    }

    // initialize 3D modele loader
    const initLoader = function( ) {

        // object loader
        const objLoader = new THREE.OBJLoader( loadingManager );
        objLoader.setPath( '/modeles/' );

        //material loader
        const mtlLoader = new THREE.MTLLoader( loadingManager );
        mtlLoader.setPath( '/modeles/' );

        mtlLoader.load( 'bins.mtl', ( materials ) => {

            materials.preload( );
            objLoader.setMaterials( materials );
            objLoader.load( 'bins.obj', ( object ) => {
                object.position.set( -3, -1, -17 );
                object.rotation.x = 0.3;
                for ( let mesh of object.children ) {
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                }
                scene.add( object );
            } );

        } );


//////////////////////////////////////////////////////////////////////////////////////////
// this is the loop chich normaly run the load all the models from our array "model"
/*
        for ( let _key in model ) {

            ( function( key ) {

                // object loader
                const objLoader = new THREE.OBJLoader( loadingManager );
                objLoader.setPath( '/modeles/' );

                //material loader
                const mtlLoader = new THREE.MTLLoader( loadingManager );
                mtlLoader.setPath( '/modeles/' );

                mtlLoader.load( model[key].mtl, ( materials ) => {

                    materials.preload( );
                    objLoader.setMaterials( materials );
                    objLoader.load( model[key].obj, ( object ) => {
                        for ( let mesh of object.children ) {
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                        }
                        model[key].mesh = object.children;
                    } );

                } );

            } ) (_key);

        }
*/
    }; 

    const onLoaded = function( ) {
        // this function is normaly call after all the ressources are loaded.
        // it calls scene.add for all the meshes created during the ressource loading.
    }
    
    // add an object in your hand
    const addObjectInHand = function( ) {

        // we should normaly add the mesh corresponding but as we could issues loading them, we only change the color of the square
        const randomObj = model[ Object.keys( model )[ Math.floor( Math.random( ) * ( Object.keys( model ).length - 1 ) ) + 1 ] ];
        const cubeGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        const cubeMaterial = new THREE.MeshLambertMaterial( { color: randomObj.bin } );
        cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
        cube.name = randomObj.color;
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add( cube );
        objectInHand.push( cube );
        moveHand( );

    }

    // create an array when an object is throwed and set up all the parameters for the throw
    const createObjectUpAir = function( mesh, beg ) {

        raycaster.setFromCamera( mouse, camera );
        theta = raycaster.ray.direction.y > 0 ? Math.PI/2 - getAngle( raycaster.ray.direction, { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z } ) :
            getAngle( raycaster.ray.direction, { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z } ) + Math.PI/2;
        phi = raycaster.ray.direction.x > 0 ? getAngle( { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z }, z ) : 
            -getAngle( { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z }, z ); 
        max = getMaxDist( theta );

        const object = { };
        object.mesh = mesh;
        object.steps = 70; // it represents the "speed" of the throw, the more step we have, the slower the throw is.
        object.theta = theta;
        object.phi = phi;
        object.max = max;
        object.xStep = object.max * Math.sin( phi ) / object.steps;
        object.zStep = object.max * Math.cos( phi ) / object.steps;
        object.yMax = beg.y / Math.abs( theta == 0 ? Math.sin( 0.001 ) : Math.sin( theta ) );
        object.thetaStep = ( Math.PI - theta ) / object.steps;
        object.actualStep = 0;
        return object;

    }

    // refresh the position of the object in air and allow to remove them if the throw is finished
    // returns:
    //      0: throw is finished and failed
    //      1: throw is not finished
    //      2: throw is finished and won
    const throwed = function( object ) {
   
        object.mesh.position.x += object.xStep;
        object.mesh.position.y = object.yMax * Math.sin( object.theta );
        object.mesh.position.z += object.zStep;
        object.actualStep += 1;
        object.theta += object.thetaStep;

        if ( object.mesh.position.y < 5.3 && object.mesh.position.y > 4.80 && object.mesh.position.z < -12.6 && object.mesh.position.z > -15.6 ) {

            if ( object.mesh.position.x < 0.03 && object.mesh.position.x > -2.87 ) { // inside the green bin
                if ( object.mesh.name == 'green' )
                    return 2;
                return 0;
            }
            if ( object.mesh.position.x < 3.20 && object.mesh.position.x > 0.3 ) { // inside the blue bin
                if ( object.mesh.name == 'blue' )
                    return 2;
                return 0;
            }
            if ( object.mesh.position.x < -3.25 && object.mesh.position.x > -6.15 ) { // inside the yellow bin
                if ( object.mesh.name == 'yellow' )
                    return 2;
                return 0;
            }
            if ( object.mesh.position.x < 7.43 && object.mesh.position.x > 3.53 ) { // inside the grey bin
                if ( object.mesh.name == 'grey' )
                    return 2;
                return 0;
            }
        }
        // if all the steps to complete the throw are down return 0 so the object is deleted
        if ( object.actualStep >= object.steps )
            return 0;
        return 1;

    }

    // initialize all the variables and the event
    const init = function( ) {

        initScene( );
        initCamera( );
        initRender( );
        initLights( );
        initLoader( );
        initObjects( );

        loadingManager = new THREE.LoadingManager( );

        loadingManager.onProgress = function( item, loaded, total ) {
            console.log( item, loaded, total );
        }

        loadingManager.onLoad = function( ) {
            console.log( "all resources loaded" );
            RESOURCES_LOADED = true;
            onLoaded( );
        }

        // function resolving problems when resizing the window
        window.addEventListener( 'resize', ( ) => {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix( );
            renderer.setSize( window.innerWidth, window.innerHeight );

        } );

        // function on click : throw
        window.addEventListener( 'mousedown', ( ) => {

            // if there is an object in our hand
            if ( objectInHand[0] ) {

                // save last throw time
                time = performance.now( );
                pos.copy( objectInHand[0].position );
                raycaster.setFromCamera( mouse, camera );

                // add the object throwed to the objects in the air and remove from the objects in our hand
                objectsUpAir.push( createObjectUpAir( objectInHand[0], pos ) );  
                objectInHand.shift( );

            } 

        } );

    }

    // move the object in hand depending on the camera
    const moveHand = function( ) {

        if( !objectInHand[0] ) 
            addObjectInHand( );
        raycaster.setFromCamera( mouse, camera );
        pos.copy( raycaster.ray.direction );
        pos.x = pos.x * 5;
        pos.y = pos.y * 5;
        pos.z = pos.z * 5;
        pos.add( raycaster.ray.origin );
        objectInHand[0].position.copy( pos );

    }

    // refresh the position of the objects in air, remove the object if the throw is finished
    const moveObjectsUpAir = function( ) {
    
        for ( let mesh of objectsUpAir ) {
            const rslThrow = throwed( mesh );
            if ( rslThrow != 1 ) {
                objectsUpAir.splice( objectsUpAir.indexOf( mesh ), 1 );
                scene.remove( mesh.mesh );
                if ( rslThrow == 2 ) {
                    COMBO += 1;
                    SCORE += COMBO * 100;
                }
                else {
                    SCORE -= 50;
                    COMBO = 0;
                }
                MAX_COMBO = Math.max( MAX_COMBO, COMBO );
            }
        }

    }

    // refresh the position of the target depending on the camera
    // Not working as expected
    const aimHelper = function( ) {

        raycaster.setFromCamera( mouse, camera );
        theta = raycaster.ray.direction.y > 0 ? Math.PI/2 - getAngle( raycaster.ray.direction, { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z } ) :
            getAngle( raycaster.ray.direction, { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z } ) + Math.PI/2;
        phi = raycaster.ray.direction.x > 0 ? getAngle( { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z }, z ) : 
            -getAngle( { x: raycaster.ray.direction.x, y: 0, z: raycaster.ray.direction.z }, z ); 
        max = getMaxDist( theta );

        const lines = { };
        lines.points = [ ];
        lines.steps = 50;
        lines.theta = theta;
        lines.max = max;
        lines.pos = new THREE.Vector3( ).copy( raycaster.ray.direction );
        lines.pos.multiplyScalar( 5 );
        lines.xStep = lines.max * Math.sin( phi ) / lines.steps;
        lines.zStep = lines.max * Math.cos( phi ) / lines.steps;
        lines.thetaStep = ( Math.PI - theta ) / lines.steps;
        lines.yMax = raycaster.ray.direction.y;
        lines.yMax = 
        lines.yMax = ( ( camera.position.y + lines.pos.y ) / ( theta == 0 ? Math.sin( 0.001 ) : Math.sin( theta ) ) );

        for ( let i = 0; i < lines.steps; i++ ) {
            lines.pos.x += lines.xStep;
            lines.pos.y = lines.yMax * Math.sin( lines.theta );
            lines.pos.z += lines.zStep;
            lines.theta += lines.thetaStep;
            lines.points.push( lines.pos );
        }

        const lineGeometry = new THREE.BufferGeometry( ).setFromPoints( lines.points );
        const lineMaterial = new THREE.LineBasicMaterial( {
            color: 'red',
            linewidth: 5,
            /*dashSize: 10,
            gapSize: 10*/
        } );
        line = new THREE.Line( lineGeometry, lineMaterial );
        line.scale.setScalar( 2 );
        line.position.set( 0, 10, -20 );
        scene.add( line );

    }

    // game logic
    const update = function( ) {

        document.getElementById( 'score' ).innerHTML = "Score : " + SCORE;          // update the score on the HTML
        document.getElementById( 'combo' ).innerHTML = "x" + COMBO;                 // update the combo on the HTML
        document.getElementById( 'timer' ).innerHTML = String( 20 - ( performance.now( ) - timeInPause )/1000 ).substring( 0, 4 ) + "s"; // update the timer on the HTML
        // End of the game
        if ( performance.now( ) - timeInPause >= 19989 ) {
            controls.unlock( );
        }
        if ( ( performance.now( ) - time ) >= reload ) {   
            moveHand( );
        }
        moveObjectsUpAir( );
        console.log( performance.now( ) );
        // aimHelper( );

    }

    //draw render
    const render = function( ) {

        renderer.render( scene, camera );

    }

    // main loop
    const animate = function( ) {

        requestAnimationFrame( animate );

        render( );
        if ( controls.isLocked == true ) {
            update( );
        }

    }
    
    return {
        init: ( ) => init( ),
        animate: ( ) => animate( )
    }

}) ();