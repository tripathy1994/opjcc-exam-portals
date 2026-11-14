import {DatabaseSync} from 'node:sqlite';
export class LocalD1{
 constructor(file=':memory:'){this.sqlite=new DatabaseSync(file);this.sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');}
 prepare(sql){const db=this.sqlite;return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};},_run(){return db.prepare(sql).run(...args);}};}};}
 async batch(statements){this.sqlite.exec('BEGIN IMMEDIATE');try{const out=statements.map(s=>s._run());this.sqlite.exec('COMMIT');return out;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
 close(){this.sqlite.close();}
}
