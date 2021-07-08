/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import args from 'args';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import path from 'path';

interface Flags {
  publicFolder: string;
  port: number;
}

args
  .option('publicFolder', 'The public folder to serve', './public')
  .option('port', 'The port on which the server will be running', 8080);
const flags = args.parse(process.argv) as Flags;

const hostname = '0.0.0.0';
const { port, publicFolder } = flags;
const rootPath = path.resolve(__dirname, publicFolder);

const startupMessage = `I'll serve "${rootPath}" on "${hostname}:${port}".`;
console.log(startupMessage);

const server = fastify({
  logger: true,
});

server.register(fastifyStatic, {
  root: rootPath,
  maxAge: 24 * 60 * 60 * 1000,
  lastModified: true,
  prefix: '/dashboard/',
});
server.get('/', async (request, reply) => {
  reply.code(204);
  return reply.send();
});

server.listen(port, hostname, (err, address) => {
  if (err) throw err;
})
